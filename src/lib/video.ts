import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_VIDEOS_PER_PROPERTY = 2;
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_VIDEO_SECONDS = 120;
export const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/webm"];

/**
 * Container signatures. MP4 and friends carry an "ftyp" box at offset 4;
 * WebM is a Matroska stream starting with the EBML magic number.
 */
const VIDEO_SIGNATURES: { mime: string; bytes: number[]; offset: number }[] = [
  { mime: "video/mp4", bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // "ftyp"
  { mime: "video/webm", bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0 }, // EBML
];

/** Confirm the bytes really are a supported container, not just the label. */
export function detectVideoType(buffer: Buffer): string | null {
  for (const sig of VIDEO_SIGNATURES) {
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

export interface SavedVideo {
  url: string;
  extension: string;
}

/**
 * Write an uploaded video straight to disk.
 *
 * Deliberately no transcoding: this runs on shared Node hosting where
 * spawning ffmpeg is unreliable and a long CPU burst gets killed mid-request.
 * The browser caps size and duration before upload and supplies the poster
 * frame, so the server only validates and stores.
 *
 * To add compression later — on a VPS — transcode `buffer` here and return the
 * processed path; nothing else has to change.
 */
export async function saveVideo(
  buffer: Buffer,
  propertyId: string,
  index: number,
  mimeType: string
): Promise<SavedVideo> {
  const relativeDir = path.posix.join("uploads", "properties", propertyId);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);

  await mkdir(absoluteDir, { recursive: true });

  const extension = mimeType === "video/webm" ? "webm" : "mp4";
  const fileName = `video-${Date.now()}-${index}.${extension}`;

  await writeFile(path.join(absoluteDir, fileName), buffer);

  return { url: `/${relativeDir}/${fileName}`, extension };
}
