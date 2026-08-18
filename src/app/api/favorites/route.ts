import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { readJsonBody } from "@/lib/api";

const favoriteSchema = z.object({
  propertyId: z.string().min(1),
});

/**
 * POST /api/favorites — toggle a property in the signed-in user's favourites.
 * Returns the resulting state so the client does not need a second request.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await readJsonBody(request);
    if (body.error) return body.error;

    const parsed = favoriteSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { propertyId } = parsed.data;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, status: "APPROVED" },
      select: { id: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: { userId: session.userId, propertyId },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ isFavorite: false });
    }

    await prisma.favorite.create({
      data: { userId: session.userId, propertyId },
    });

    return NextResponse.json({ isFavorite: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/favorites error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/favorites — the signed-in user's favourited property ids, so the
 * client can render the correct toggle state.
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ propertyIds: [] });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.userId },
      select: { propertyId: true },
    });

    return NextResponse.json({
      propertyIds: favorites.map((f) => f.propertyId),
    });
  } catch (error) {
    console.error("GET /api/favorites error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
