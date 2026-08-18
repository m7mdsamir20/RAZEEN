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

function createPrismaClient() {
  const creds = getCredentials();

  // ── Diagnostic: log credentials (password partially masked) ───────
  const pw = creds.password || "";
  const masked =
    pw.length <= 3
      ? "***"
      : pw[0] + "*".repeat(pw.length - 2) + pw[pw.length - 1];
  console.log("[DB] Connecting with:", {
    host: creds.host,
    port: creds.port,
    user: creds.user,
    password: `${masked} (len=${pw.length})`,
    database: creds.database,
    source: process.env.DB_USER ? "individual vars" : "DATABASE_URL",
  });

  // ── Diagnostic: test a direct connection ──────────────────────────
  mariadb
    .createConnection({
      host: creds.host,
      port: creds.port,
      user: creds.user,
      password: creds.password,
      database: creds.database,
      connectTimeout: 10_000,
    })
    .then((conn) => {
      console.log("[DB] ✅ Direct connection test SUCCEEDED");
      conn.end();
    })
    .catch((err) => {
      console.error("[DB] ❌ Direct connection FAILED:", err.message);
      console.error("[DB] Error code:", err.code, "| errno:", err.errno);
    });

  // Shared hosting (Hostinger) has tight MySQL connection limits.
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
