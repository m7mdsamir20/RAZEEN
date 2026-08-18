import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { readJsonBody } from "@/lib/api";
import { MANAGEMENT_STATUSES } from "@/types";

const updateMarketingStatusSchema = z.object({
  status: z.enum(MANAGEMENT_STATUSES),
});

/**
 * PATCH /api/admin/marketing/[id] — move a marketing enquiry along its
 * lifecycle (NEW → CONTACTED → CLOSED).
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

    const parsed = updateMarketingStatusSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await prisma.marketingRequest.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const marketingRequest = await prisma.marketingRequest.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ request: marketingRequest });
  } catch (error) {
    console.error("PATCH /api/admin/marketing/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
