import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { readJsonBody } from "@/lib/api";
import { createMarketingRequestSchema } from "@/lib/validations/request";
import { notifyAdmins } from "@/lib/notifications";

/**
 * POST /api/marketing — submit a "market my property" enquiry.
 *
 * Like the management enquiry this is a lead for the company rather than a
 * public listing, so it needs a signed-in owner to follow up with but no
 * Nafath verification.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await readJsonBody(request);
    if (body.error) return body.error;

    const parsed = createMarketingRequestSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const marketingRequest = await prisma.marketingRequest.create({
      data: {
        ...parsed.data,
        // Optional text fields arrive as "" from the form; store null.
        whatsapp: parsed.data.whatsapp?.trim() || null,
        notes: parsed.data.notes?.trim() || null,
        userId: session.userId,
      },
    });

    after(() =>
      notifyAdmins({
        type: "NEW_MARKETING",
        params: { name: marketingRequest.ownerName },
        link: "/admin/marketing?status=NEW",
      })
    );

    return NextResponse.json({ request: marketingRequest }, { status: 201 });
  } catch (error) {
    console.error("POST /api/marketing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
