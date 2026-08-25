import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

/**
 * Rewrite stored media URLs from `/uploads/...` to `/media/...`.
 *
 *   npx tsx scripts/migrate-media-urls.ts            # show what would change
 *   npx tsx scripts/migrate-media-urls.ts --apply    # write the changes
 *
 * Uploads moved out of `public/` so a deployment can no longer delete them,
 * which changed the path they are served from. Rows written before that still
 * point at the old prefix.
 *
 * This only rewrites the URL. Files that were already lost to a deployment
 * stay lost — those listings need their photos uploading again.
 */

const databaseUrl = process.env.DATABASE_URL;
const useIndividual = Boolean(process.env.DB_USER);

if (!databaseUrl && !useIndividual) {
  console.error("No database configured.");
  process.exit(1);
}

const adapter = useIndividual
  ? new PrismaMariaDb({
      socketPath: process.env.DB_SOCKET || "/var/lib/mysql/mysql.sock",
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
    })
  : new PrismaMariaDb(databaseUrl!);

const prisma = new PrismaClient({ adapter });

const OLD = "/uploads/";
const NEW = "/media/";

async function main() {
  const apply = process.argv.includes("--apply");

  const images = await prisma.propertyImage.findMany({
    select: { id: true, url: true, thumbnailUrl: true },
  });
  const videos = await prisma.propertyVideo.findMany({
    select: { id: true, url: true, thumbnailUrl: true },
  });

  const swap = (value: string | null) =>
    value?.startsWith(OLD) ? NEW + value.slice(OLD.length) : value;

  let changed = 0;

  for (const image of images) {
    const url = swap(image.url)!;
    const thumbnailUrl = swap(image.thumbnailUrl)!;
    if (url === image.url && thumbnailUrl === image.thumbnailUrl) continue;

    changed++;
    console.log(`image ${image.id}: ${image.url} -> ${url}`);
    if (apply) {
      await prisma.propertyImage.update({
        where: { id: image.id },
        data: { url, thumbnailUrl },
      });
    }
  }

  for (const video of videos) {
    const url = swap(video.url)!;
    const thumbnailUrl = swap(video.thumbnailUrl);
    if (url === video.url && thumbnailUrl === video.thumbnailUrl) continue;

    changed++;
    console.log(`video ${video.id}: ${video.url} -> ${url}`);
    if (apply) {
      await prisma.propertyVideo.update({
        where: { id: video.id },
        data: { url, thumbnailUrl },
      });
    }
  }

  console.log(
    changed === 0
      ? "Nothing to change."
      : apply
        ? `Updated ${changed} row(s).`
        : `${changed} row(s) would change. Re-run with --apply.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
