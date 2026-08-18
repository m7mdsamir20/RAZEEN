/**
 * Backfill `formattedAddress` and `nearbyPlaces` for listings published before
 * the Google server key was configured.
 *
 * Only touches rows that have coordinates and are missing the data, so it is
 * safe to re-run: already-filled listings are skipped and cost nothing.
 *
 *   npm run backfill:locations              # fill what's missing
 *   npm run backfill:locations -- --dry-run # report, change nothing
 *   npm run backfill:locations -- --force   # refetch even if already filled
 *   npm run backfill:locations -- --limit=5 # stop after N listings
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  hasServerMapsKey,
  reverseGeocode,
  fetchNearbyPlaces,
} from "../src/lib/google-maps-server";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

/** Pause between listings so a large backfill does not spike the API. */
const DELAY_MS = 400;

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isForce = args.includes("--force");
const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!hasServerMapsKey()) {
    console.error(
      "\n✖ GOOGLE_MAPS_SERVER_KEY is missing or malformed in .env.\n" +
        "  This script needs the server key (Geocoding + Places).\n"
    );
    process.exit(1);
  }

  // Coordinates are what make the lookups possible; without them there is
  // nothing to resolve.
  const candidates = await prisma.property.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      ...(isForce
        ? {}
        : {
            OR: [{ formattedAddress: null }, { nearbyPlaces: null }],
          }),
    },
    select: {
      id: true,
      title: true,
      city: true,
      district: true,
      region: true,
      latitude: true,
      longitude: true,
      formattedAddress: true,
      nearbyPlaces: true,
    },
    orderBy: { createdAt: "asc" },
    ...(limit ? { take: limit } : {}),
  });

  const skipped = await prisma.property.count({
    where: { OR: [{ latitude: null }, { longitude: null }] },
  });

  console.log(`\n📍 Backfill${isDryRun ? " (dry run)" : ""}`);
  console.log(`   ${candidates.length} listing(s) to process`);
  if (skipped > 0) {
    console.log(`   ${skipped} skipped — no coordinates on the map`);
  }
  console.log("");

  let addressCount = 0;
  let placesCount = 0;
  let failures = 0;

  for (const [index, property] of candidates.entries()) {
    const { latitude, longitude } = property;
    if (latitude === null || longitude === null) continue;

    const position = `${index + 1}/${candidates.length}`;
    console.log(`[${position}] ${property.title}`);

    const update: { formattedAddress?: string; nearbyPlaces?: string } = {};

    // --- Address ---
    if (isForce || !property.formattedAddress) {
      try {
        const address = await reverseGeocode(latitude, longitude);

        if (address?.formattedAddress) {
          update.formattedAddress = address.formattedAddress;
          addressCount++;
          console.log(`         address: ${address.formattedAddress}`);

          // Report a mismatch rather than silently rewriting what a human
          // typed — the pin may simply be slightly off.
          if (address.city && address.city !== property.city) {
            console.log(
              `         ⚠ city differs: stored "${property.city}" vs map "${address.city}"`
            );
          }
          if (address.district && address.district !== property.district) {
            console.log(
              `         ⚠ district differs: stored "${property.district}" vs map "${address.district}"`
            );
          }
        } else {
          console.log("         address: no result");
        }
      } catch (error) {
        failures++;
        console.log(`         ✖ address failed: ${(error as Error).message}`);
      }
    }

    // --- Nearby landmarks ---
    if (isForce || !property.nearbyPlaces) {
      try {
        const places = await fetchNearbyPlaces(latitude, longitude);

        if (places.length > 0) {
          update.nearbyPlaces = JSON.stringify(places);
          placesCount++;
          console.log(
            `         places : ${places.length} found — ${places
              .slice(0, 3)
              .map((p) => p.name)
              .join(", ")}`
          );
        } else {
          console.log("         places : none found");
        }
      } catch (error) {
        failures++;
        console.log(`         ✖ places failed: ${(error as Error).message}`);
      }
    }

    if (Object.keys(update).length > 0 && !isDryRun) {
      await prisma.property.update({ where: { id: property.id }, data: update });
    }

    if (index < candidates.length - 1) await sleep(DELAY_MS);
  }

  console.log("\n─────────────────────────────");
  console.log(`addresses ${isDryRun ? "resolvable" : "written"} : ${addressCount}`);
  console.log(`landmark sets ${isDryRun ? "resolvable" : "written"} : ${placesCount}`);
  if (failures > 0) console.log(`failures                    : ${failures}`);
  if (isDryRun) console.log("\n(dry run — nothing was saved)");
  console.log("");
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
