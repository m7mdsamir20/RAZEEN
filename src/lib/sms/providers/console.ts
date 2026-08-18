import type { SmsPayload, SmsResult } from "../index";

/**
 * Development sender: prints the message instead of sending it.
 *
 * This is the default so an unconfigured deployment fails loudly in the logs
 * rather than appearing to send messages that never arrive.
 */
export async function sendViaConsole(
  phone: string,
  payload: SmsPayload
): Promise<SmsResult> {
  console.log(
    `\n📱 SMS (console provider — not actually sent)\n   to: ${phone}\n   ${payload.message.replace(/\n/g, "\n   ")}\n`
  );

  return { success: true, messageId: "console" };
}
