import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Credentials come either from individual variables or from a connection URL.
 *
 * The individual variables win because a password containing `@`, `#` or `/`
 * has to be percent-encoded inside a URL, and getting that wrong fails in a
 * way that looks like a wrong password.
 */
function getCredentials() {
  const { DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  if (DB_USER && DB_PASSWORD && DB_NAME) {
    return { user: DB_USER, password: DB_PASSWORD, database: DB_NAME };
  }

  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "No database configured. Set DB_USER, DB_PASSWORD and DB_NAME, or DATABASE_URL."
    );
  }

  const parsed = new URL(url);

  return {
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    host: parsed.hostname || "localhost",
    port: parsed.port ? Number(parsed.port) : 3306,
  };
}

function createPrismaClient() {
  const creds = getCredentials();

  // Shared hosting grants the MySQL user access from 'localhost' only, which
  // means a Unix socket rather than TCP — and the driver resolves "localhost"
  // to ::1 over TCP, which that grant rejects. So when the individual
  // variables are in use (the hosting setup), connect through the socket
  // explicitly; a local DATABASE_URL still connects over TCP.
  const useSocket = Boolean(process.env.DB_USER);

  const connection = useSocket
    ? {
        socketPath: process.env.DB_SOCKET || "/var/lib/mysql/mysql.sock",
        user: creds.user,
        password: creds.password,
        database: creds.database,
      }
    : creds;

  const adapter = new PrismaMariaDb({
    // Shared hosting caps concurrent connections, so the pool stays small and
    // waits rather than opening more.
    connectionLimit: 3,
    idleTimeout: 30,
    connectTimeout: 30_000,
    acquireTimeout: 30_000,
    ...connection,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse one client across hot reloads in development; production gets a fresh
// one per process.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
