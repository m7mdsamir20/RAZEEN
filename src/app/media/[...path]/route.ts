import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { extname } from "node:path";
import { resolveMediaPath } from "@/lib/media-storage";

/**
 * Serves uploaded photos and videos.
 *
 * They are stored outside the built application so a deployment cannot wipe
 * them, which also puts them outside anything the web server exposes
 * statically — hence this handler.
 */

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  const filePath = resolveMediaPath(segments);
  if (!filePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const contentType = CONTENT_TYPES[extname(filePath).toLowerCase()];
  // Only the types we write are served; anything else is treated as absent so
  // the directory cannot be used to hand out arbitrary files.
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!fileStat.isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  // File names carry a timestamp and are never rewritten, so they can be
  // cached hard. `stat` gives a cheap validator for conditional requests.
  const etag = `"${fileStat.size}-${fileStat.mtimeMs}"`;

  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  const stream = Readable.toWeb(
    createReadStream(filePath)
  ) as ReadableStream<Uint8Array>;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileStat.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: etag,
    },
  });
}
