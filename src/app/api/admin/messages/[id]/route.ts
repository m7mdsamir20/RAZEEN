import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { readJsonBody } from "@/lib/api";

const updateMessageSchema = z.object({ isRead: z.boolean() });

/** PATCH /api/admin/messages/[id] — mark a contact message read or unread. */
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

    const parsed = updateMessageSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await prisma.contactMessage.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { isRead: parsed.data.isRead },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("PATCH /api/admin/messages/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** DELETE /api/admin/messages/[id] — remove a contact message. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await prisma.contactMessage.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    await prisma.contactMessage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/messages/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
