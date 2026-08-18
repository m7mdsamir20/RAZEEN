import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { notify } from "@/lib/notifications";
import { readJsonBody } from "@/lib/api";
import { updatePropertyStatusSchema } from "@/lib/validations/property";

/**
 * PATCH /api/admin/requests/[id] — approve or reject a property request.
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

    const existing = await prisma.propertyRequest.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const propertyRequest = await prisma.propertyRequest.update({
      where: { id },
      data: {
        status: parsed.data.status,
        rejectionReason:
          parsed.data.status === "REJECTED"
            ? (parsed.data.rejectionReason?.trim() ?? null)
            : null,
      },
    });

    after(() =>
      notify({
        userId: propertyRequest.userId,
        type:
          propertyRequest.status === "APPROVED"
            ? "REQUEST_APPROVED"
            : "REQUEST_REJECTED",
        params: { title: propertyRequest.title },
        link: "/requests",
      })
    );

    return NextResponse.json({ request: propertyRequest });
  } catch (error) {
    console.error("PATCH /api/admin/requests/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** DELETE /api/admin/requests/[id] — remove a property request. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await prisma.propertyRequest.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    await prisma.propertyRequest.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/requests/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
