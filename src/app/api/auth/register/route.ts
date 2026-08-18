import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { readJsonBody } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { consumeOtp } from "@/lib/otp";
import { startSession, publicUser } from "@/lib/auth-session";

/**
 * POST /api/auth/register — finish registration.
 *
 * The code proves the number belongs to whoever is registering; the password
 * is what they will use from then on. Both are checked here, and the account
 * only exists once both pass.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    if (body.error) return body.error;

    const parsed = registerSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { phone, code, name, password } = parsed.data;

    // Re-checked here, not just at send-otp: two people could have started
    // registering the same number before either finished.
    const existing = await prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account already exists", code: "ACCOUNT_EXISTS" },
        { status: 409 }
      );
    }

    const otp = await consumeOtp(phone, code);

    if (!otp.ok) {
      return NextResponse.json(
        { error: otp.error, code: otp.code },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: { name, phone, passwordHash: await hashPassword(password) },
    });

    await startSession(user);

    return NextResponse.json({
      success: true,
      isNewUser: true,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
