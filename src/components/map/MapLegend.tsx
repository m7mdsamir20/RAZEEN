"use client";

import { useTranslations } from "next-intl";
import { PROPERTY_CATEGORIES } from "@/types";
import { CATEGORY_COLORS, CATEGORY_LABEL_KEYS } from "@/lib/categories";

/** Colour key for the map's category-coded pins. */
export function MapLegend() {
  const t = useTranslations();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">
        {t("map.legend")}
      </h2>
      <ul className="flex flex-wrap lg:flex-col gap-x-4 gap-y-2">
        {PROPERTY_CATEGORIES.map((category) => (
          <li key={category} className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 ring-1 ring-black/10"
              style={{ backgroundColor: CATEGORY_COLORS[category] }}
              aria-hidden="true"
            />
            <span className="text-sm text-gray-700">
              {t(CATEGORY_LABEL_KEYS[category])}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
