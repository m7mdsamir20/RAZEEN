import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { readJsonBody } from "@/lib/api";
import { DEAL_STATUSES } from "@/types";

/**
 * `null` reopens the listing, so the field is nullable rather than optional —
 * an absent key would be indistinguishable from "clear it".
 */
const dealSchema = z.object({
  dealStatus: z.enum(DEAL_STATUSES).nullable(),
});

/**
 * PATCH /api/properties/[id]/deal — the publisher marks their listing sold or
 * rented, or reopens it.
 *
 * Deliberately separate from the edit endpoint: closing a deal is a one-tap
 * action from the listings page, not a form submission, and it must not
 * require sending the whole listing back.
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
      select: { id: true, userId: true, type: true },
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

    const parsed = dealSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { dealStatus } = parsed.data;

    // A rental cannot be "sold" and a sale cannot be "rented".
    const expected = existing.type === "RENT" ? "RENTED" : "SOLD";

    if (dealStatus !== null && dealStatus !== expected) {
      return NextResponse.json(
        { error: "Deal status does not match the listing purpose" },
        { status: 400 }
      );
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        dealStatus,
        dealClosedAt: dealStatus ? new Date() : null,
      },
    });

    return NextResponse.json({ property });
  } catch (error) {
    console.error("PATCH /api/properties/[id]/deal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
