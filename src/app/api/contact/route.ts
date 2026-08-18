import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/api";
import { createContactMessageSchema } from "@/lib/validations/contact";

/** Max messages accepted from one email address within the window. */
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;

/**
 * POST /api/contact — store a message from the public contact form.
 * Open to anonymous visitors, so it is rate limited per email address.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    if (body.error) return body.error;

    const parsed = createContactMessageSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, message } = parsed.data;

    const recent = await prisma.contactMessage.count({
      where: {
        email,
        createdAt: { gte: new Date(Date.now() - RATE_WINDOW_MS) },
      },
    });

    if (recent >= RATE_LIMIT) {
      return NextResponse.json(
        { error: "Too many messages" },
        { status: 429 }
      );
    }

    await prisma.contactMessage.create({
      data: {
        name,
        email,
        // Zod allows "" so the optional field can round-trip; store null instead.
        phone: phone ? phone : null,
        subject,
        message,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/contact error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
