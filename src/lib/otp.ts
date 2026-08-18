import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 3;

export type OtpResult =
  | { ok: true }
  | { ok: false; error: string; code: "OTP_INVALID" | "OTP_EXPIRED" };

/**
 * Consume the verification code for a phone number.
 *
 * Shared by registration and password reset, which both need exactly this:
 * find the live code, count the attempt, compare, and burn it on success so a
 * single code can never be used twice.
 */
export async function consumeOtp(
  phone: string,
  code: string
): Promise<OtpResult> {
  const otpSession = await prisma.otpSession.findFirst({
    where: { phone, verified: false, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otpSession) {
    return {
      ok: false,
      code: "OTP_EXPIRED",
      error: "OTP expired or not found. Please request a new code.",
    };
  }

  if (otpSession.attempts >= MAX_ATTEMPTS) {
    return {
      ok: false,
      code: "OTP_EXPIRED",
      error: "Too many attempts. Please request a new code.",
    };
  }

  await prisma.otpSession.update({
    where: { id: otpSession.id },
    data: { attempts: otpSession.attempts + 1 },
  });

  if (otpSession.code !== code) {
    return { ok: false, code: "OTP_INVALID", error: "Invalid verification code" };
  }

  await prisma.otpSession.update({
    where: { id: otpSession.id },
    data: { verified: true },
  });

  return { ok: true };
}
