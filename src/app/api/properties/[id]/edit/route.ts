import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { readJsonBody } from "@/lib/api";
import { editPropertySchema } from "@/lib/validations/property";

/**
 * PATCH /api/properties/[id]/edit — the publisher updates their own listing.
 *
 * Status, publisher type and ownership are never taken from the body; a user
 * editing their listing cannot approve it or reassign it.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.property.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const isOwner = existing.userId === session.userId;
    const isAdmin = session.role === "COMPANY_ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await readJsonBody(request);
    if (body.error) return body.error;

    const parsed = editPropertySchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Blank optional strings mean "clear it", so map "" to null explicitly.
    const data = Object.fromEntries(
      Object.entries(parsed.data).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ])
    );

    const property = await prisma.property.update({
      where: { id },
      data,
    });

    return NextResponse.json({ property });
  } catch (error) {
    console.error("PATCH /api/properties/[id]/edit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
