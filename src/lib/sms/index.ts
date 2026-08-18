import { sendViaConsole } from "./providers/console";
import { sendViaAuthentica } from "./providers/authentica";
import { sendViaUnifonic } from "./providers/unifonic";
import { sendViaTaqnyat } from "./providers/taqnyat";
import { sendViaTwilio } from "./providers/twilio";

export interface SmsResult {
  success: boolean;
  /** Provider-side id, useful when chasing a delivery failure. */
  messageId?: string;
  error?: string;
}

/**
 * Two shapes of provider exist, so the payload carries both:
 *
 * - Plain gateways (Unifonic, Taqnyat, Twilio) send `message` verbatim.
 * - OTP platforms (Authentica) own the message template and want only the
 *   bare `otpCode` to interpolate into it.
 */
export interface SmsPayload {
  message: string;
  otpCode?: string;
}

export type SmsSender = (
  /** Saudi mobile in local form, e.g. 0551234567. */
  phone: string,
  payload: SmsPayload
) => Promise<SmsResult>;

const PROVIDERS: Record<string, SmsSender> = {
  console: sendViaConsole,
  authentica: sendViaAuthentica,
  unifonic: sendViaUnifonic,
  taqnyat: sendViaTaqnyat,
  twilio: sendViaTwilio,
};

/**
 * Which provider actually sends. Defaults to `console`, which only logs —
 * so a missing configuration is obvious in development rather than silently
 * pretending to send.
 */
export function activeProviderName(): string {
  return (process.env.SMS_PROVIDER ?? "console").toLowerCase();
}

export function isRealSmsConfigured(): boolean {
  return activeProviderName() !== "console";
}

/**
 * Convert a local Saudi number to E.164, which every provider expects.
 * 0551234567 → +966551234567
 */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("966")) return `+${digits}`;
  if (digits.startsWith("0")) return `+966${digits.slice(1)}`;
  return `+966${digits}`;
}

/**
 * Send an SMS through the configured provider.
 *
 * Never throws: a provider outage should surface as a failed result the
 * caller can handle, not an unhandled exception in a request path.
 */
export async function sendSms(
  phone: string,
  payload: SmsPayload
): Promise<SmsResult> {
  const name = activeProviderName();
  const provider = PROVIDERS[name];

  if (!provider) {
    console.error(`Unknown SMS_PROVIDER "${name}" — falling back to console.`);
    return sendViaConsole(phone, payload);
  }

  try {
    return await provider(phone, payload);
  } catch (error) {
    console.error(`SMS send failed via ${name}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * The OTP message body, in the recipient's language.
 *
 * Only reaches the handset on plain gateways. Template-based providers such
 * as Authentica compose the text on their side, so the wording there is
 * configured in their dashboard rather than here.
 */
export function otpMessage(code: string, locale: string = "ar"): string {
  return locale === "ar"
    ? `رمز التحقق الخاص بك في رزيم العقارية هو: ${code}\nالرمز صالح لمدة 5 دقائق. لا تشاركه مع أحد.`
    : `Your Razeem Real Estate verification code is: ${code}\nValid for 5 minutes. Do not share it with anyone.`;
}
