"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SearchX, Loader2 } from "lucide-react";
import { RequestCard } from "./RequestCard";
import type { PropertyRequestListItem } from "@/lib/queries/requests";

interface RequestGridProps {
  /** First page, rendered on the server so results are in the HTML. */
  initialItems: PropertyRequestListItem[];
  initialCursor: string | null;
  filterQuery: string;
}

export function RequestGrid({
  initialItems,
  initialCursor,
  filterQuery,
}: RequestGridProps) {
  const t = useTranslations();

  const [extraItems, setExtraItems] = useState<PropertyRequestListItem[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const items = [...initialItems, ...extraItems];

  async function loadMore() {
    if (!cursor || isLoadingMore) return;

    setIsLoadingMore(true);
    setError("");

    try {
      const params = new URLSearchParams(filterQuery);
      params.set("cursor", cursor);

      const res = await fetch(`/api/requests?${params.toString()}`);
      if (!res.ok) throw new Error("Request failed");

      const data = (await res.json()) as {
        items: PropertyRequestListItem[];
        nextCursor: string | null;
      };

      setExtraItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    } catch {
      setError(t("common.error"));
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <SearchX className="w-8 h-8 text-gray-400" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {t("requests.noRequestsTitle")}
        </h2>
        <p className="text-base text-gray-500 max-w-sm">
          {t("requests.noRequestsDesc")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4" aria-live="polite">
        {t("requests.resultsFound", { count: items.length })}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {items.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-red-600 mt-4" role="alert">
          {error}
        </p>
      )}

      {cursor ? (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-6 py-3 text-base font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[48px]"
          >
            {isLoadingMore && (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            )}
            {t("filters.loadMore")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
