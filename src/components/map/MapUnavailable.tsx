"use client";

import { useTranslations } from "next-intl";
import { MapPinOff } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Shown instead of a broken grey canvas when the Maps key is missing or the
 * API rejects it, so the page still explains itself and offers a way forward.
 */
export function MapUnavailable({ reason }: { reason: "missing" | "auth" }) {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-4 py-16 text-center bg-gray-50 rounded-2xl border border-gray-200">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <MapPinOff className="w-8 h-8 text-gray-400" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        {t("map.unavailableTitle")}
      </h2>
      <p className="text-base text-gray-500 max-w-md mb-6">
        {reason === "auth"
          ? t("map.authFailedDesc")
          : t("map.unavailableDesc")}
      </p>
      <Link
        href="/properties"
        className="px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors min-h-[48px] flex items-center focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
      >
        {t("map.browseInstead")}
      </Link>
    </div>
  );
}
