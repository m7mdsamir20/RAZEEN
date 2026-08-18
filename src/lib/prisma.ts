import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import mariadb from "mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill it in."
    );
  }

  const creds = parseConnectionString(url);

  // ── Diagnostic: log parsed credentials (password masked) ──────────
  console.log("[DB] Connecting with:", {
    host: creds.host,
    port: creds.port,
    user: creds.user,
    password: creds.password ? "***" + creds.password.slice(-3) : "(empty)",
    database: creds.database,
  });

  // ── Diagnostic: test a raw connection to surface the real error ────
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
      console.error("[DB] ❌ Direct connection test FAILED:", err.message);
      console.error("[DB] Error code:", err.code, "| errno:", err.errno);
    });

  // Shared hosting (Hostinger) has tight MySQL connection limits.
  // Keep the pool small to stay within quota, and give the DB more
  // time to respond on cold starts.
  const adapter = new PrismaMariaDb({
    connectionLimit: 3,
    // Shared hosting drops idle connections; reconnect rather than fail.
    idleTimeout: 30,
    connectTimeout: 30_000,
    // How long to wait for a free slot in the pool before giving up.
    acquireTimeout: 30_000,
    ...creds,
  });

  return new PrismaClient({ adapter });
}

/**
 * The adapter takes either a connection string or a config object. Passing the
 * object lets the pool settings above sit alongside the credentials, so the
 * URL stays the single place the host, user and database are configured.
 */
function parseConnectionString(url: string) {
  const parsed = new URL(url);

  // Force TCP/IP: the mariadb driver uses a Unix socket when it sees
  // "localhost", which is usually inaccessible on shared hosting.
  let host = parsed.hostname;
  if (host === "localhost") host = "127.0.0.1";

  return {
    host,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  };
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse one client across hot reloads in development; production gets a fresh
// one per process.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

