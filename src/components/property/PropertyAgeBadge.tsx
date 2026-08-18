"use client";

import { useTranslations, useLocale } from "next-intl";

/** Human-readable property age: "جديد" for 0, otherwise "N سنة". */
export function formatAge(
  ageYears: number | null,
  t: (key: string, values?: Record<string, string | number>) => string,
  locale: string
): string | null {
  if (ageYears === null || ageYears === undefined) return null;
  if (ageYears === 0) return t("propertyExtra.ageNew");

  const years = new Intl.NumberFormat(
    locale === "ar" ? "ar-SA" : "en-SA"
  ).format(ageYears);

  return t("propertyExtra.ageYears", { years });
}

/** Compact age chip for cards; renders nothing when the age is unknown. */
export function PropertyAgeBadge({
  ageYears,
  className = "",
}: {
  ageYears: number | null;
  className?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const label = formatAge(ageYears, t, locale);
  if (!label) return null;

  const isNew = ageYears === 0;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
        isNew
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-gray-100 text-gray-600"
      } ${className}`}
    >
      {label}
    </span>
  );
}
