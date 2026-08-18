import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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

  // A pool rather than a single connection: serverless-style request handling
  // opens and closes connections constantly, and MariaDB hosting caps how many
  // may be open at once.
  const adapter = new PrismaMariaDb({
    connectionLimit: 10,
    // Shared hosting drops idle connections; reconnect rather than fail.
    idleTimeout: 60,
    connectTimeout: 10_000,
    ...parseConnectionString(url),
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

  return {
    host: parsed.hostname,
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
