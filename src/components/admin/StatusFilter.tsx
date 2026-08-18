"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface StatusFilterProps {
  /**
   * Status values with their translation keys, in display order.
   * Plain data rather than a mapper function — server components can only
   * hand serializable props to client components.
   */
  statuses: readonly { value: string; labelKey: string }[];
}

/** Segmented status filter shared by the admin queues. */
export function StatusFilter({ statuses }: StatusFilterProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = searchParams.get("status") ?? "";

  function select(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  const options = [{ value: "", label: t("admin.filterAll") }].concat(
    statuses.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))
  );

  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        role="group"
        aria-label={t("common.filter")}
        className="flex flex-wrap gap-1.5"
      >
        {options.map(({ value, label }) => {
          const isActive = current === value;

          return (
            <button
              key={value || "all"}
              onClick={() => select(value)}
              aria-pressed={isActive}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-[background-color,color,border-color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px] ${
                isActive
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 hover:text-primary"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {isPending && (
        <Loader2
          className="w-4 h-4 animate-spin text-gray-400"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
