import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGES_PER_PROPERTY,
  detectImageType,
  processAndSaveImage,
} from "@/lib/upload";

/**
 * POST /api/properties/[id]/images — upload images for a property.
 * Only the property owner (or a company admin) may upload.
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
      select: { id: true, userId: true, _count: { select: { images: true } } },
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
    const files = formData.getAll("images").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    const remainingSlots = MAX_IMAGES_PER_PROPERTY - property._count.images;

    if (files.length > remainingSlots) {
      return NextResponse.json(
        {
          error: "Too many images",
          maxImages: MAX_IMAGES_PER_PROPERTY,
          remaining: remainingSlots,
        },
        { status: 400 }
      );
    }

    // Validate every file before writing anything to disk.
    const buffers: Buffer[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File too large", maxSize: MAX_FILE_SIZE },
          { status: 400 }
        );
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Unsupported file type", allowed: ALLOWED_MIME_TYPES },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // The declared MIME type is client-controlled — confirm the bytes agree.
      if (!detectImageType(buffer)) {
        return NextResponse.json(
          { error: "File content is not a valid image" },
          { status: 400 }
        );
      }

      buffers.push(buffer);
    }

    // Process and persist.
    const startOrder = property._count.images;
    const created = [];

    for (let i = 0; i < buffers.length; i++) {
      const { url, thumbnailUrl } = await processAndSaveImage(
        buffers[i],
        property.id,
        startOrder + i
      );

      const image = await prisma.propertyImage.create({
        data: {
          propertyId: property.id,
          url,
          thumbnailUrl,
          order: startOrder + i,
        },
      });

      created.push(image);
    }

    return NextResponse.json({ images: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/properties/[id]/images error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
