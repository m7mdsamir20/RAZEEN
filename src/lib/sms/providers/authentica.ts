import { toE164, type SmsPayload, type SmsResult } from "../index";

/**
 * Authentica — a Saudi OTP platform (api.authentica.sa, v2).
 *
 * Required environment:
 *   SMS_PROVIDER=authentica
 *   AUTHENTICA_API_KEY=...        the X-Authorization value
 *   AUTHENTICA_TEMPLATE_ID=31     the message template configured in their
 *                                 dashboard — the wording and branding of the
 *                                 SMS live there, not in this file
 *
 * We pass our own `otp`, which Authentica uses instead of generating one.
 * That keeps expiry, attempt limits and rate limiting in our own OtpSession
 * table, and means swapping providers later is a one-line env change rather
 * than an auth rewrite. Their /verify-otp endpoint is therefore unused.
 */
const ENDPOINT = "https://api.authentica.sa/api/v2/send-otp";

/**
 * The key looks like `$2y$10$...`. In a .env file each `$` has to be escaped
 * as `\$`, because the loader would otherwise read it as a variable — but a
 * hosting panel takes the value literally, and pasting the escaped form there
 * sends backslashes the API rejects as Unauthorized.
 *
 * A backslash never appears in a real key, so stripping them is safe and turns
 * an easy copy-paste mistake into a warning instead of a silent outage.
 */
function readApiKey(): string | undefined {
  const raw = process.env.AUTHENTICA_API_KEY;
  if (!raw) return undefined;

  const cleaned = raw.replace(/\\/g, "").trim();

  if (cleaned !== raw.trim()) {
    console.warn(
      "AUTHENTICA_API_KEY contained backslashes; they were stripped. " +
        "Store the key without escaping outside of .env files."
    );
  }

  return cleaned;
}

export async function sendViaAuthentica(
  phone: string,
  payload: SmsPayload
): Promise<SmsResult> {
  const apiKey = readApiKey();
  const templateId = process.env.AUTHENTICA_TEMPLATE_ID;

  if (!apiKey) {
    return { success: false, error: "AUTHENTICA_API_KEY is not set" };
  }
  if (!payload.otpCode) {
    return { success: false, error: "Authentica requires an OTP code" };
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "X-Authorization": apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      method: "sms",
      phone: toE164(phone),
      // Sending our own code makes Authentica deliver it rather than mint one.
      otp: payload.otpCode,
      ...(templateId ? { template_id: Number(templateId) } : {}),
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || data?.success === false) {
    // Surface the provider's own wording — it names the actual problem
    // (unverified number, no balance, bad template) far better than a code.
    const detail =
      data?.message ??
      (data?.errors ? JSON.stringify(data.errors) : null) ??
      `Authentica responded ${res.status}`;

    return { success: false, error: detail };
  }

  return { success: true, messageId: data?.data?.id?.toString() };
}
