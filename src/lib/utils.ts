/**
 * Format a price as a bare number, with no currency text.
 *
 * The Riyal mark is rendered separately by the <Price> component so it can be
 * drawn as a symbol rather than the "ر.س" abbreviation.
 */
export function formatAmount(price: number, locale: string = "ar"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Price with the currency abbreviation, for contexts that cannot render JSX
 * (page titles, metadata, structured data).
 */
export function formatPrice(price: number, locale: string = "ar"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Apply a percentage discount, returning the payable amount.
 * Guards against absent or out-of-range percentages.
 */
export function discountedPrice(
  price: number,
  discountPercent: number | null | undefined
): number {
  if (!discountPercent || discountPercent <= 0 || discountPercent >= 100) {
    return price;
  }
  return Math.round(price * (1 - discountPercent / 100));
}

/**
 * Format area in square meters.
 */
export function formatArea(area: number, locale: string = "ar"): string {
  const formatted = new Intl.NumberFormat(
    locale === "ar" ? "ar-SA" : "en-SA"
  ).format(area);
  return locale === "ar" ? `${formatted} م²` : `${formatted} sqm`;
}

/**
 * Generate a 4-digit OTP code.
 */
export function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
