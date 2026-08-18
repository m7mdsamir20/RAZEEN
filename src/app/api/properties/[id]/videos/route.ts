import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_VIDEOS_PER_PROPERTY,
  MAX_VIDEO_SECONDS,
  MAX_VIDEO_SIZE,
  detectVideoType,
  saveVideo,
} from "@/lib/video";

/**
 * POST /api/properties/[id]/videos — upload videos for a property.
 *
 * The browser sends each video plus a poster frame it captured, so the server
 * never has to decode the file. Only the owner (or a company admin) may upload.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const property = await prisma.property.findUnique({
      where: { id },
      select: { id: true, userId: true, _count: { select: { videos: true } } },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const isOwner = property.userId === session.userId;
    const isAdmin = session.role === "COMPANY_ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData
      .getAll("videos")
      .filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No videos provided" }, { status: 400 });
    }

    const remaining = MAX_VIDEOS_PER_PROPERTY - property._count.videos;

    if (files.length > remaining) {
      return NextResponse.json(
        {
          error: "Too many videos",
          maxVideos: MAX_VIDEOS_PER_PROPERTY,
          remaining,
        },
        { status: 400 }
      );
    }

    // Validate everything before writing anything.
    const accepted: { buffer: Buffer; mime: string; duration: number }[] = [];

    for (const [index, file] of files.entries()) {
      if (file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json(
          { error: "Video too large", maxSize: MAX_VIDEO_SIZE },
          { status: 400 }
        );
      }

      if (!ALLOWED_VIDEO_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Unsupported video type", allowed: ALLOWED_VIDEO_MIME_TYPES },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      const detected = detectVideoType(buffer);
      if (!detected) {
        return NextResponse.json(
          { error: "File content is not a valid video" },
          { status: 400 }
        );
      }

      // Duration is measured in the browser; treat it as a hint, not a fact.
      const duration = Number(formData.get(`duration-${index}`) ?? 0);

      if (duration > MAX_VIDEO_SECONDS) {
        return NextResponse.json(
          { error: "Video too long", maxSeconds: MAX_VIDEO_SECONDS },
          { status: 400 }
        );
      }

      accepted.push({ buffer, mime: detected, duration });
    }

    const startOrder = property._count.videos;
    const created = [];

    for (const [index, item] of accepted.entries()) {
      const { url } = await saveVideo(
        item.buffer,
        property.id,
        startOrder + index,
        item.mime
      );

      const thumbnailUrl = await savePoster(
        formData.get(`poster-${index}`),
        property.id,
        startOrder + index
      );

      const video = await prisma.propertyVideo.create({
        data: {
          propertyId: property.id,
          url,
          thumbnailUrl,
          sizeBytes: item.buffer.length,
          durationSec: Math.round(item.duration) || null,
          order: startOrder + index,
        },
      });

      created.push(video);
    }

    return NextResponse.json({ videos: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/properties/[id]/videos error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Store the browser-captured poster frame as WebP.
 * A missing or unreadable poster is not worth failing the upload over.
 */
async function savePoster(
  poster: FormDataEntryValue | null,
  propertyId: string,
  index: number
): Promise<string | null> {
  if (!(poster instanceof File) || poster.size === 0) return null;

  try {
    const relativeDir = path.posix.join("uploads", "properties", propertyId);
    const absoluteDir = path.join(process.cwd(), "public", relativeDir);
    await mkdir(absoluteDir, { recursive: true });

    const buffer = Buffer.from(await poster.arrayBuffer());
    const webp = await sharp(buffer)
      .resize({ width: 600, height: 450, fit: "cover" })
      .webp({ quality: 75 })
      .toBuffer();

    const fileName = `video-poster-${Date.now()}-${index}.webp`;
    await writeFile(path.join(absoluteDir, fileName), webp);

    return `/${relativeDir}/${fileName}`;
  } catch (error) {
    console.error("Video poster skipped:", error);
    return null;
  }
}
