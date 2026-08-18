import { toE164, type SmsPayload, type SmsResult } from "../index";

/**
 * Unifonic — a Saudi provider, widely used for OTP traffic in the Kingdom.
 *
 * Required environment:
 *   SMS_PROVIDER=unifonic
 *   UNIFONIC_APP_SID=...      from the Unifonic console
 *   UNIFONIC_SENDER_ID=...    the sender name approved by the regulator
 *
 * The sender name must be registered and approved before messages to Saudi
 * numbers will deliver; an unapproved name is rejected by the operator.
 */
const ENDPOINT = "https://el.cloud.unifonic.com/rest/SMS/messages";

export async function sendViaUnifonic(
  phone: string,
  payload: SmsPayload
): Promise<SmsResult> {
  const message = payload.message;

  const appSid = process.env.UNIFONIC_APP_SID;
  const senderId = process.env.UNIFONIC_SENDER_ID;

  if (!appSid) {
    return { success: false, error: "UNIFONIC_APP_SID is not set" };
  }

  const body = new URLSearchParams({
    AppSid: appSid,
    Recipient: toE164(phone).replace("+", ""),
    Body: message,
    ...(senderId ? { SenderID: senderId } : {}),
  });

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || data?.success === false || data?.success === "false") {
    return {
      success: false,
      error: data?.message ?? `Unifonic responded ${res.status}`,
    };
  }

  return { success: true, messageId: data?.data?.MessageID?.toString() };
}
