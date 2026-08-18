import { MessageCircle } from "lucide-react";

/**
 * Turn a Saudi mobile number into the international form wa.me expects:
 * 0551234567 → 966551234567.
 */
export function whatsappHref(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "");
  const number = digits.startsWith("966") ? digits : `966${digits}`;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${query}`;
}

interface WhatsAppButtonProps {
  /** Saudi mobile number in local (05…) or international form. */
  phone: string;
  label: string;
  /** Prefilled message body. */
  message?: string;
  className?: string;
}

/**
 * The one WhatsApp call-to-action used across the platform, in WhatsApp's own
 * green so it reads as "this opens WhatsApp" before the label is even read.
 */
export function WhatsAppButton({
  phone,
  label,
  message,
  className = "",
}: WhatsAppButtonProps) {
  return (
    <a
      href={whatsappHref(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white bg-[#25D366] rounded-xl hover:bg-[#1EBE5A] transition-colors focus-visible:ring-2 focus-visible:ring-[#25D366]/40 focus-visible:outline-none min-h-[44px] ${className}`}
    >
      <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      {label}
    </a>
  );
}
