import { toE164, type SmsPayload, type SmsResult } from "../index";

/**
 * Taqnyat (تقنيات) — a Saudi provider, often cheaper per message than the
 * international alternatives for KSA-only traffic.
 *
 * Required environment:
 *   SMS_PROVIDER=taqnyat
 *   TAQNYAT_BEARER_TOKEN=...  from the Taqnyat dashboard
 *   TAQNYAT_SENDER=...        the approved sender name
 */
const ENDPOINT = "https://api.taqnyat.sa/v1/messages";

export async function sendViaTaqnyat(
  phone: string,
  payload: SmsPayload
): Promise<SmsResult> {
  const message = payload.message;

  const token = process.env.TAQNYAT_BEARER_TOKEN;
  const sender = process.env.TAQNYAT_SENDER;

  if (!token) {
    return { success: false, error: "TAQNYAT_BEARER_TOKEN is not set" };
  }
  if (!sender) {
    return { success: false, error: "TAQNYAT_SENDER is not set" };
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      recipients: [toE164(phone).replace("+", "")],
      body: message,
      sender,
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  // Taqnyat signals success with statusCode 201 in the payload.
  if (!res.ok || (data?.statusCode && data.statusCode >= 300)) {
    return {
      success: false,
      error: data?.message ?? `Taqnyat responded ${res.status}`,
    };
  }

  return { success: true, messageId: data?.messageId?.toString() };
}
