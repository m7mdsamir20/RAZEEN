import sharp from "sharp";
import { writeFile } from "node:fs/promises";

/**
 * Build favicon.ico from the brand icon.
 *
 * The one that shipped with the project was create-next-app's default, which
 * is what browsers showed in the tab — they prefer /favicon.ico over the
 * other icon files.
 *
 * Frames are stored as PNG inside the ICO container, which every browser in
 * use supports and which keeps the file far smaller than bitmap frames.
 */

const SOURCE = "public/icon-512.png";
const OUTPUT = "src/app/favicon.ico";
const SIZES = [16, 32, 48, 256];

/**
 * The source has wide transparent margins. Left in, they shrink the mark to
 * roughly half the frame, and at 16x16 the thin copper outline all but
 * vanishes. Trimming has to be its own pipeline — sharp applies it to the
 * input, so it cannot be chained onto the resize below.
 */
const trimmed = await sharp(SOURCE).trim({ threshold: 10 }).toBuffer();

const frames = await Promise.all(
  SIZES.map(async (size) => ({
    size,
    data: await sharp(trimmed)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toBuffer(),
  }))
);

const HEADER = 6;
const ENTRY = 16;

const header = Buffer.alloc(HEADER);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // 1 = icon
header.writeUInt16LE(frames.length, 4);

let offset = HEADER + ENTRY * frames.length;
const directory = [];

for (const frame of frames) {
  const entry = Buffer.alloc(ENTRY);
  // 256 is stored as 0 — the field is a single byte.
  entry.writeUInt8(frame.size === 256 ? 0 : frame.size, 0);
  entry.writeUInt8(frame.size === 256 ? 0 : frame.size, 1);
  entry.writeUInt8(0, 2); // palette colours
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(frame.data.length, 8);
  entry.writeUInt32LE(offset, 12);

  directory.push(entry);
  offset += frame.data.length;
}

const ico = Buffer.concat([
  header,
  ...directory,
  ...frames.map((frame) => frame.data),
]);

await writeFile(OUTPUT, ico);

console.log(`${OUTPUT} — ${ico.length} bytes, ${frames.length} frames`);
for (const frame of frames) {
  console.log(`   ${frame.size}x${frame.size}  ${frame.data.length} bytes`);
}
