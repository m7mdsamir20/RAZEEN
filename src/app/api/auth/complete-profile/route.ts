import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { completeProfileSchema } from "@/lib/validations/auth";
import { readJsonBody } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await readJsonBody(request);
    if (body.error) return body.error;

    const result = completeProfileSchema.safeParse(body.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name } = result.data;

    // Update user name
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { name },
    });

    // Update session
    session.name = user.name;
    await session.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        isNafathVerified: user.isNafathVerified,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
