"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  GraduationCap,
  Landmark,
  Cross,
  ShoppingCart,
  Store,
  Trees,
  Pill,
  MapPin,
} from "lucide-react";

const TYPE_ICONS: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  school: GraduationCap,
  mosque: Landmark,
  hospital: Cross,
  supermarket: ShoppingCart,
  shopping_mall: Store,
  park: Trees,
  pharmacy: Pill,
};

export interface NearbyPlace {
  name: string;
  type: string;
  distanceMeters: number;
}

/**
 * Landmarks around the property, read from the cached Places result stored on
 * the listing. Renders nothing when there is no cache — a listing published
 * before the key was configured simply omits the section.
 */
export function NearbyPlaces({ raw }: { raw: string | null }) {
  const t = useTranslations();
  const locale = useLocale();

  const places = parsePlaces(raw);
  if (places.length === 0) return null;

  const numberFormat = new Intl.NumberFormat(
    locale === "ar" ? "ar-SA" : "en-SA"
  );

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        {t("nearby.title")}
      </h2>
      <p className="text-sm text-gray-500 mb-3">{t("nearby.subtitle")}</p>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {places.map((place, index) => {
          const Icon = TYPE_ICONS[place.type] ?? MapPin;

          const distance =
            place.distanceMeters >= 1000
              ? t("nearby.km", {
                  distance: numberFormat.format(
                    Math.round((place.distanceMeters / 1000) * 10) / 10
                  ),
                })
              : t("nearby.meters", {
                  distance: numberFormat.format(place.distanceMeters),
                });

          return (
            <li
              key={`${place.name}-${index}`}
              className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl"
            >
              <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-gray-900 truncate">
                  {place.name}
                </span>
                <span className="block text-xs text-gray-500">
                  {t(`nearby.${place.type}`)}
                </span>
              </span>
              <span className="text-sm text-gray-500 shrink-0">{distance}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The column holds JSON written by our own server, but parse defensively. */
function parsePlaces(raw: string | null): NearbyPlace[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (place): place is NearbyPlace =>
        typeof place?.name === "string" &&
        typeof place?.type === "string" &&
        typeof place?.distanceMeters === "number"
    );
  } catch {
    return [];
  }
}
