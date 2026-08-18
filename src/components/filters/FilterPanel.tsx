"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, Loader2 } from "lucide-react";

export const CITIES = [
  "الرياض",
  "جدة",
  "الدمام",
  "مكة المكرمة",
  "المدينة المنورة",
];

export const FILTER_FIELD_CLASS =
  "w-full px-3 py-2.5 text-base bg-white border border-gray-300 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-[border-color,box-shadow] min-h-[44px]";

/**
 * URL-backed filter state. Filters live in the query string so results are
 * shareable and the server can render them; changes go through a transition
 * to keep the current results interactive while the next page streams in.
 */
export function useFilterParams(keys: readonly string[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const values = Object.fromEntries(
    keys.map((key) => [key, searchParams.get(key) ?? ""])
  ) as Record<string, string>;

  const activeCount = Object.values(values).filter(Boolean).length;

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("cursor"); // a new filter set starts from the first page

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function clearAll() {
    startTransition(() => router.push(pathname));
  }

  return { values, activeCount, isPending, update, clearAll };
}

interface FilterPanelProps {
  activeCount: number;
  isPending: boolean;
  onClearAll: () => void;
  children: React.ReactNode;
}

/**
 * Shared chrome for every filter sidebar: a collapsible panel on mobile, an
 * always-open card on desktop. Callers supply the fields themselves.
 */
export function FilterPanel({
  activeCount,
  isPending,
  onClearAll,
  children,
}: FilterPanelProps) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  const spinner = isPending ? (
    <Loader2 className="w-4 h-4 animate-spin text-gray-400" aria-hidden="true" />
  ) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden flex items-center justify-between w-full px-4 py-3 text-base font-medium text-gray-900 min-h-[48px]"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5" aria-hidden="true" />
          {t("common.filter")}
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold text-white bg-primary rounded-full">
              {activeCount}
            </span>
          )}
        </span>
        {spinner}
      </button>

      <div
        className={`${isOpen ? "block" : "hidden"} lg:block border-t lg:border-t-0 border-gray-100 p-4`}
      >
        <div className="hidden lg:flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <SlidersHorizontal className="w-5 h-5" aria-hidden="true" />
            {t("common.filter")}
          </h2>
          {spinner}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {children}
        </div>

        {activeCount > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center justify-center gap-1.5 w-full mt-4 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 hover:text-primary transition-[color,background-color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px]"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            {t("filters.clearAll")}
          </button>
        )}
      </div>
    </div>
  );
}

interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: FilterSelectProps) {
  const t = useTranslations();

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1.5"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={FILTER_FIELD_CLASS}
      >
        <option value="">{t("filters.all")}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
