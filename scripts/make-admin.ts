import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

/**
 * Promote an account to company admin.
 *
 *   npx tsx scripts/make-admin.ts 0512345678
 *   npx tsx scripts/make-admin.ts 0512345678 --revoke
 *
 * Saves opening a database client on the server just to flip one column. The
 * account must already exist — register through the site first.
 *
 * The role is copied into the session cookie at sign-in, so whoever is
 * promoted has to sign out and back in before the dashboard appears.
 */

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });

async function main() {
  const args = process.argv.slice(2);
  const phone = args.find((arg) => !arg.startsWith("--"));
  const revoke = args.includes("--revoke");

  if (!phone || !/^05\d{8}$/.test(phone)) {
    console.error("Usage: npx tsx scripts/make-admin.ts 05XXXXXXXX [--revoke]");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    console.error(
      `No account for ${phone}. Register on the site first, then run this.`
    );
    process.exit(1);
  }

  const role = revoke ? "USER" : "COMPANY_ADMIN";

  if (user.role === role) {
    console.log(`${user.name} (${phone}) is already ${role}. Nothing to do.`);
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { role } });

  console.log(`${user.name} (${phone}): ${user.role} → ${role}`);
  console.log("They must sign out and sign in again for this to take effect.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
