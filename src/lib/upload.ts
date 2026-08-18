import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Sharp } from "sharp";

export const MAX_IMAGES_PER_PROPERTY = 10;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Magic-number signatures — the declared MIME type is attacker-controlled.
const SIGNATURES: { mime: string; bytes: number[]; offset: number }[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff], offset: 0 },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47], offset: 0 },
  { mime: "image/webp", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // "WEBP" after the RIFF header
];

/**
 * Verify the buffer really is one of the allowed image formats by inspecting
 * its magic number, not the client-supplied Content-Type.
 */
export function detectImageType(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    const slice = buffer.subarray(sig.offset, sig.offset + sig.bytes.length);
    if (
      slice.length === sig.bytes.length &&
      sig.bytes.every((b, i) => slice[i] === b)
    ) {
      return sig.mime;
    }
  }
  return null;
}

// ============================================
// Watermark
// ============================================

const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");

/** Logo width as a fraction of the image width. */
const WATERMARK_SCALE = 0.24;
/** Inset from the image edges, as a fraction of the image width. */
const WATERMARK_MARGIN = 0.03;
const WATERMARK_OPACITY = 0.82;
const SHADOW_OPACITY = 0.55;
const SHADOW_BLUR = 4;
/** Stacking the blurred shadow builds a halo that survives white backgrounds. */
const SHADOW_LAYERS = 3;
/** Below this the mark would be an illegible smudge — skip it instead. */
const MIN_WATERMARK_WIDTH = 60;

// Preparing the mark costs several decodes, so keep one buffer per width.
const watermarkCache = new Map<number, Promise<Buffer>>();

/** Scale a layer's alpha channel by `opacity`, preserving its shape. */
function scaleAlpha(input: Buffer, opacity: number): Promise<Buffer> {
  return sharp(input)
    .composite([
      {
        input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();
}

/**
 * Build the watermark: a white silhouette of the logo over a soft dark halo.
 *
 * The brand logo is dark teal and copper, which disappears against dark
 * photos, so the mark is recoloured white and backed by a stacked blurred
 * shadow — that combination stays legible on both bright and dark images.
 */
async function buildWatermark(logoWidth: number): Promise<Buffer> {
  // Resize to a concrete buffer first — metadata() on a pending pipeline
  // reports the source dimensions, not the resized ones.
  const resized = await sharp(LOGO_PATH)
    .resize({ width: logoWidth, withoutEnlargement: true })
    .ensureAlpha()
    .png()
    .toBuffer();

  const { width, height } = await sharp(resized).metadata();
  if (!width || !height) throw new Error("Could not measure the resized logo");

  const alpha = await sharp(resized).extractChannel("alpha").png().toBuffer();

  const white = await sharp({
    create: { width, height, channels: 3, background: "#ffffff" },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();

  const shadow = await sharp({
    create: { width, height, channels: 3, background: "#000000" },
  })
    .joinChannel(await sharp(alpha).blur(SHADOW_BLUR).toBuffer())
    .png()
    .toBuffer();

  const pad = SHADOW_BLUR * 3;
  const shadowLayer = await scaleAlpha(shadow, SHADOW_OPACITY);
  const whiteLayer = await scaleAlpha(white, WATERMARK_OPACITY);

  return sharp({
    create: {
      width: width + pad * 2,
      height: height + pad * 2,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      ...Array.from({ length: SHADOW_LAYERS }, () => ({
        input: shadowLayer,
        left: pad,
        top: pad + 1,
      })),
      { input: whiteLayer, left: pad, top: pad },
    ])
    .png()
    .toBuffer();
}

function getWatermark(width: number): Promise<Buffer> {
  const cached = watermarkCache.get(width);
  if (cached) return cached;

  const buffer = buildWatermark(width);
  watermarkCache.set(width, buffer);
  return buffer;
}

/**
 * Encode `image` to WebP with the platform logo stamped on the bottom-start
 * corner. A watermark failure must never fail the upload, so any error falls
 * back to the un-marked image.
 */
async function toWatermarkedWebp(
  image: Sharp,
  quality: number
): Promise<Buffer> {
  const encode = (pipeline: Sharp) =>
    pipeline.webp({ quality }).toBuffer();

  try {
    const { width, height } = await image.metadata();
    if (!width || !height) return encode(image);

    const logoWidth = Math.round(width * WATERMARK_SCALE);
    if (logoWidth < MIN_WATERMARK_WIDTH) return encode(image);

    const watermark = await getWatermark(logoWidth);
    const markMeta = await sharp(watermark).metadata();
    if (!markMeta.width || !markMeta.height) return encode(image);

    const margin = Math.round(width * WATERMARK_MARGIN);

    return await encode(
      image.composite([
        {
          input: watermark,
          left: margin,
          top: height - markMeta.height - margin,
        },
      ])
    );
  } catch (error) {
    console.error("Watermark skipped:", error);
    return encode(image);
  }
}

export interface ProcessedImage {
  url: string;
  thumbnailUrl: string;
}

/**
 * Compress an uploaded image to WebP, stamp it with the platform logo, write a
 * full-size and a thumbnail variant under /uploads/properties/[propertyId]/,
 * and return their public URLs.
 */
export async function processAndSaveImage(
  buffer: Buffer,
  propertyId: string,
  index: number
): Promise<ProcessedImage> {
  const relativeDir = path.posix.join("uploads", "properties", propertyId);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);

  await mkdir(absoluteDir, { recursive: true });

  const baseName = `${Date.now()}-${index}`;
  const fullName = `${baseName}.webp`;
  const thumbName = `${baseName}-thumb.webp`;

  // sharp drops EXIF by default; rotate() bakes in the orientation flag first.
  const source = sharp(buffer).rotate();

  // Resize before watermarking so the logo is measured against the final size.
  const [fullResized, thumbResized] = await Promise.all([
    source
      .clone()
      .resize({
        width: 1600,
        height: 1200,
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer(),
    source
      .clone()
      .resize({ width: 600, height: 450, fit: "cover" })
      .toBuffer(),
  ]);

  const [fullBuffer, thumbBuffer] = await Promise.all([
    toWatermarkedWebp(sharp(fullResized), 82),
    toWatermarkedWebp(sharp(thumbResized), 75),
  ]);

  await Promise.all([
    writeFile(path.join(absoluteDir, fullName), fullBuffer),
    writeFile(path.join(absoluteDir, thumbName), thumbBuffer),
  ]);

  return {
    url: `/${relativeDir}/${fullName}`,
    thumbnailUrl: `/${relativeDir}/${thumbName}`,
  };
}
