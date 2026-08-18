/**
 * Single source of truth for the company's public details.
 *
 * ⚠️ PLACEHOLDER DATA — replace every value in CONTACT and SOCIAL with the
 * real ones before going live. Everything that renders contact information
 * (footer, contact page, JSON-LD, sitemap) reads from here, so changing a
 * value in this file updates the whole site.
 */

/**
 * Canonical origin, used for absolute URLs in metadata and the sitemap.
 *
 * Read at build time, so it has to be set before `next build` runs — setting
 * it only at runtime leaves the placeholder baked into the pages.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export const CONTACT = {
  email: "info@razeem.sa",
  phone: "+966500000001",
  /** Same number, formatted for display. */
  phoneDisplay: "+966 50 000 0001",
  whatsapp: "+966500000001",
  /** Street and district only — city and country are appended separately. */
  addressAr: "طريق الملك فهد، حي العليا",
  addressEn: "King Fahd Road, Al Olaya",
  postalCode: "12211",
  cityAr: "الرياض",
  cityEn: "Riyadh",
  countryAr: "المملكة العربية السعودية",
  countryEn: "Saudi Arabia",
  /** Riyadh city centre — swap for the real office coordinates. */
  latitude: 24.7136,
  longitude: 46.6753,
  workingHoursAr: "الأحد – الخميس، 9 صباحاً – 6 مساءً",
  workingHoursEn: "Sunday – Thursday, 9am – 6pm",
} as const;

export const SOCIAL = {
  x: "https://x.com/razeem",
  instagram: "https://instagram.com/razeem",
  linkedin: "https://linkedin.com/company/razeem",
} as const;

/** Founding year, shown in the footer copyright and the About page. */
export const FOUNDED_YEAR = 2020;

export function localizedAddress(locale: string): string {
  return locale === "ar" ? CONTACT.addressAr : CONTACT.addressEn;
}

/** Street, district, city, postal code and country as one display line. */
export function fullAddress(locale: string): string {
  const separator = locale === "ar" ? "، " : ", ";
  return [
    localizedAddress(locale),
    `${localizedCity(locale)} ${CONTACT.postalCode}`,
    localizedCountry(locale),
  ].join(separator);
}

export function localizedCity(locale: string): string {
  return locale === "ar" ? CONTACT.cityAr : CONTACT.cityEn;
}

export function localizedCountry(locale: string): string {
  return locale === "ar" ? CONTACT.countryAr : CONTACT.countryEn;
}

export function localizedHours(locale: string): string {
  return locale === "ar" ? CONTACT.workingHoursAr : CONTACT.workingHoursEn;
}
