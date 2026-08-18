import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/properties/[id] — get a single property with full details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        user: {
          select: { name: true, phone: true },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Only show APPROVED properties to public (or owner/admin)
    if (property.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Increment views
    await prisma.property.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ property });
  } catch (error) {
    console.error("GET /api/properties/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
