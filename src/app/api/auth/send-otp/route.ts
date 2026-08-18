import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp } from "@/lib/utils";
import { sendOtpSchema } from "@/lib/validations/auth";
import { readJsonBody } from "@/lib/api";
import { sendSms, otpMessage, isRealSmsConfigured } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    if (body.error) return body.error;

    const result = sendOtpSchema.safeParse(body.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { phone, mode } = result.data;

    // Tell the caller about a mismatched intent before spending a code on it.
    const existing = await prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });

    if (mode === "register" && existing) {
      return NextResponse.json(
        { error: "An account already exists", code: "ACCOUNT_EXISTS" },
        { status: 409 }
      );
    }

    if (mode === "reset" && !existing) {
      return NextResponse.json(
        { error: "No account for this number", code: "NO_ACCOUNT" },
        { status: 404 }
      );
    }

    // Rate limit: max 3 OTPs per phone in last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentOtps = await prisma.otpSession.count({
      where: {
        phone,
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (recentOtps >= 3) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429 }
      );
    }

    // Generate OTP code (4 digits)
    const code = generateOtp();

    // Save OTP session
    await prisma.otpSession.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    // `message` is used by plain gateways; `otpCode` by template-based OTP
    // platforms that compose the text themselves.
    const sms = await sendSms(phone, {
      message: otpMessage(code),
      otpCode: code,
    });

    if (!sms.success) {
      // The row stays, but the caller must know the message never left —
      // otherwise they wait for a code that will not arrive.
      console.error(`OTP SMS to ${phone} failed: ${sms.error}`);

      return NextResponse.json(
        { error: "Could not send the verification code", code: "SMS_FAILED" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      /**
       * The code is echoed back only when no real provider is configured —
       * i.e. local development against the console sender. Returning it once
       * SMS is live would hand the code to anyone who can call the endpoint.
       */
      ...(!isRealSmsConfigured() && process.env.NODE_ENV !== "production"
        ? { devCode: code }
        : {}),
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
