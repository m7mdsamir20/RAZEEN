import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  };
}

function createPrismaClient() {
  const creds = getCredentials();

  // On Hostinger shared hosting, the MySQL user is granted access from
  // 'localhost' only — which means Unix socket, not TCP. The mariadb driver
  // resolves "localhost" to ::1 (IPv6 TCP) on Linux, so we must specify
  // the socket path explicitly.
  //
  // For local development (DATABASE_URL with host/port), we fall back to TCP.
  const isHostinger = !!process.env.DB_USER;
  const socketPath =
    process.env.DB_SOCKET || "/var/lib/mysql/mysql.sock";

  const connectionConfig = isHostinger
    ? {
        socketPath,
        user: creds.user,
        password: creds.password,
        database: creds.database,
      }
    : {
        host: (() => {
          const url = process.env.DATABASE_URL!;
          const parsed = new URL(url);
          return parsed.hostname || "localhost";
        })(),
        port: (() => {
          const url = process.env.DATABASE_URL!;
          const parsed = new URL(url);
          return parsed.port ? Number(parsed.port) : 3306;
        })(),
        user: creds.user,
        password: creds.password,
        database: creds.database,
      };

  console.error("[DB] Connection config:", {
    ...connectionConfig,
    password: "***",
  });

  const adapter = new PrismaMariaDb({
    connectionLimit: 3,
    idleTimeout: 30,
    connectTimeout: 30_000,
    acquireTimeout: 30_000,
    ...connectionConfig,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse one client across hot reloads in development; production gets a fresh
// one per process.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
