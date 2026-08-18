"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import { dealStatusForType } from "@/types";

interface Props {
  propertyId: string;
  /** RENT or SALE — decides whether the action reads "sold" or "rented". */
  type: string;
  dealStatus: string | null;
}

/**
 * Lets the publisher close a deal, or reopen it if the sale fell through.
 * The wording follows the listing's purpose so a rental never says "sold".
 */
export function DealStatusActions({ propertyId, type, dealStatus }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const isClosed = dealStatus !== null;
  const target = dealStatusForType(type);

  async function update(next: string | null) {
    const confirmKey =
      next === null
        ? "deal.confirmReopen"
        : next === "RENTED"
          ? "deal.confirmRented"
          : "deal.confirmSold";

    if (!window.confirm(t(confirmKey))) return;

    setError("");
    setIsPending(true);

    try {
      const res = await fetch(`/api/properties/${propertyId}/deal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealStatus: next }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t("common.error"));
        return;
      }

      router.refresh();
    } catch {
      setError(t("common.error"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      {isClosed ? (
        <button
          onClick={() => update(null)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px]"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
          )}
          {t("deal.reopen")}
        </button>
      ) : (
        <button
          onClick={() => update(target)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none min-h-[44px]"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          )}
          {target === "RENTED" ? t("deal.markRented") : t("deal.markSold")}
        </button>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Grey chip marking a listing as no longer available. */
export function DealStatusBadge({
  dealStatus,
  className = "",
}: {
  dealStatus: string | null;
  className?: string;
}) {
  const t = useTranslations();

  if (!dealStatus) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-gray-700 rounded-full ${className}`}
    >
      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
      {dealStatus === "RENTED" ? t("deal.rented") : t("deal.sold")}
    </span>
  );
}
