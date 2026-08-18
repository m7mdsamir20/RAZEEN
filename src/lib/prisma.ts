import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import mariadb from "mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Build credentials from either individual env vars (preferred on hosting)
 * or from the legacy DATABASE_URL connection string.
 */
function getCredentials() {
  // Prefer individual vars — no URL-encoding headaches.
  if (process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
    return {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };
  }

  // Fall back to DATABASE_URL for local development.
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Neither DB_USER/DB_PASSWORD/DB_NAME nor DATABASE_URL is set."
    );
  }

  const parsed = new URL(url);
  return {
    host: parsed.hostname || "localhost",
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  };
}

// Common MySQL socket paths on Linux shared hosting.
const SOCKET_PATHS = [
  "/var/run/mysqld/mysqld.sock",
  "/var/lib/mysql/mysql.sock",
  "/tmp/mysql.sock",
  "/run/mysqld/mysqld.sock",
];

function createPrismaClient() {
  const creds = getCredentials();

  // ── Diagnostic: log credentials (password partially masked) ───────
  const pw = creds.password || "";
  const masked =
    pw.length <= 3
      ? "***"
      : pw.slice(0, 2) + "*".repeat(pw.length - 3) + pw.slice(-1);
  console.error("[DB] Credentials:", {
    host: creds.host,
    port: creds.port,
    user: creds.user,
    password: `${masked} (len=${pw.length})`,
    database: creds.database,
    source: process.env.DB_USER ? "individual vars" : "DATABASE_URL",
  });

  // ── Diagnostic: try every connection method ───────────────────────
  // Method 1: TCP via 127.0.0.1 (IPv4)
  mariadb
    .createConnection({
      host: "127.0.0.1",
      port: creds.port,
      user: creds.user,
      password: creds.password,
      database: creds.database,
      connectTimeout: 5_000,
    })
    .then((conn) => {
      console.error("[DB] ✅ 127.0.0.1 (IPv4 TCP) SUCCEEDED");
      conn.end();
    })
    .catch((err) => {
      console.error("[DB] ❌ 127.0.0.1 (IPv4 TCP):", err.code, err.message);
    });

  // Method 2: Try each known Unix socket path
  for (const socketPath of SOCKET_PATHS) {
    mariadb
      .createConnection({
        socketPath,
        user: creds.user,
        password: creds.password,
        database: creds.database,
        connectTimeout: 5_000,
      })
      .then((conn) => {
        console.error(`[DB] ✅ Socket ${socketPath} SUCCEEDED`);
        conn.end();
      })
      .catch((err) => {
        console.error(`[DB] ❌ Socket ${socketPath}:`, err.code, err.message);
      });
  }

  // Use the configured host for the actual adapter connection.
  const adapter = new PrismaMariaDb({
    connectionLimit: 3,
    idleTimeout: 30,
    connectTimeout: 30_000,
    acquireTimeout: 30_000,
    ...creds,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse one client across hot reloads in development; production gets a fresh
// one per process.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
