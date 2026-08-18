import { toE164, type SmsPayload, type SmsResult } from "../index";

/**
 * Twilio — international fallback.
 *
 * Called over plain REST rather than the SDK so nothing extra is installed
 * and the shared host has no native dependency to build.
 *
 * Required environment:
 *   SMS_PROVIDER=twilio
 *   TWILIO_ACCOUNT_SID=...
 *   TWILIO_AUTH_TOKEN=...
 *   TWILIO_SENDER=...   an approved alphanumeric sender ID or a Twilio number
 *
 * Note: delivery to Saudi numbers still depends on a sender ID registered
 * with the local operators — Twilio does not exempt you from that.
 */
export async function sendViaTwilio(
  phone: string,
  payload: SmsPayload
): Promise<SmsResult> {
  const message = payload.message;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const sender = process.env.TWILIO_SENDER;

  if (!accountSid || !authToken || !sender) {
    return {
      success: false,
      error: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN or TWILIO_SENDER is not set",
    };
  }

  const body = new URLSearchParams({
    To: toE164(phone),
    From: sender,
    Body: message,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
      body,
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return {
      success: false,
      error: data?.message ?? `Twilio responded ${res.status}`,
    };
  }

  return { success: true, messageId: data?.sid };
}
