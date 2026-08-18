import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { readJsonBody } from "@/lib/api";
import { updatePropertyStatusSchema } from "@/lib/validations/property";
import { after } from "next/server";
import { notify } from "@/lib/notifications";

/**
 * PATCH /api/admin/properties/[id] — approve or reject a listing.
 * Rejecting requires a reason, which the publisher sees on "my listings".
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;

    const body = await readJsonBody(request);
    if (body.error) return body.error;

    const parsed = updatePropertyStatusSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await prisma.property.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        status: parsed.data.status,
        // Clear any earlier reason when a listing is approved.
        rejectionReason:
          parsed.data.status === "REJECTED"
            ? (parsed.data.rejectionReason?.trim() ?? null)
            : null,
      },
    });

    // Tell the publisher what happened. `after` keeps it off the response
    // path — a slow write must not hold up the moderator's click.
    after(() =>
      notify({
        userId: property.userId,
        type:
          property.status === "APPROVED"
            ? "PROPERTY_APPROVED"
            : "PROPERTY_REJECTED",
        params: { title: property.title },
        link:
          property.status === "APPROVED"
            ? `/properties/${property.id}`
            : "/my-listings",
      })
    );

    return NextResponse.json({ property });
  } catch (error) {
    console.error("PATCH /api/admin/properties/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/properties/[id] — remove a listing outright.
 * Images cascade with the row; the files on disk are left in place.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await prisma.property.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    await prisma.property.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/properties/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
