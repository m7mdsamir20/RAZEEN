"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface PropertySearchProps {
  /**
   * "hero" navigates to the listings page with the term; "inline" stays on
   * the listings page and edits the `q` parameter alongside the filters.
   */
  variant?: "hero" | "inline";
  className?: string;
}

/**
 * Free-text search over listings.
 *
 * Submitted rather than typed-as-you-go: each keystroke would be a database
 * query, and a search term is something people finish writing before they
 * mean it. The term lives in the URL so results stay shareable and combine
 * with whatever filters are already applied.
 */
export function PropertySearch({
  variant = "hero",
  className = "",
}: PropertySearchProps) {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

  const current = searchParams.get("q") ?? "";
  const [term, setTerm] = useState(current);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    go(term.trim());
  }

  function go(next: string) {
    // Keep the other filters; a new search starts from the first page.
    const params = new URLSearchParams(
      variant === "inline" ? searchParams.toString() : ""
    );

    if (next) params.set("q", next);
    else params.delete("q");
    params.delete("cursor");

    const query = params.toString();
    router.push(`/properties${query ? `?${query}` : ""}`);
  }

  function clear() {
    setTerm("");
    if (current) go("");
  }

  const isHero = variant === "hero";

  return (
    <form
      onSubmit={submit}
      role="search"
      className={`${isHero ? "flex flex-col sm:flex-row gap-3 w-full max-w-2xl mx-auto" : "flex gap-2"} ${className}`}
    >
      <div className="relative flex-1">
        <Search
          className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />

        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t("search.placeholder")}
          aria-label={t("search.label")}
          maxLength={100}
          className={`w-full ps-12 ${term ? "pe-12" : "pe-4"} py-3 text-base bg-white border rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-[border-color,box-shadow] min-h-[52px] ${
            isHero ? "border-transparent shadow-sm" : "border-gray-300"
          }`}
        />

        {term ? (
          <button
            type="button"
            onClick={clear}
            aria-label={t("search.clear")}
            className="absolute end-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 text-gray-400 hover:text-gray-600 rounded-lg focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <button
        type="submit"
        className={`flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-primary rounded-xl border border-transparent hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[52px] ${
          isHero ? "" : "shrink-0"
        }`}
      >
        <Search className="w-5 h-5" aria-hidden="true" />
        <span className={isHero ? "" : "sr-only sm:not-sr-only"}>
          {t("search.submit")}
        </span>
      </button>
    </form>
  );
}
