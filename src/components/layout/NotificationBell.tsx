"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Bell, BellOff, Loader2, CheckCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { NotificationItem } from "@/lib/notifications";

/** How often the bell re-checks for new notifications while the tab is open. */
const POLL_MS = 60_000;

interface Feed {
  items: NotificationItem[];
  unreadCount: number;
}

const EMPTY_FEED: Feed = { items: [], unreadCount: 0 };

/**
 * The header's notification bell.
 *
 * Only rendered for signed-in users, so the poll below always has something
 * to fetch. The list is loaded once up front and refreshed on a slow timer —
 * frequent enough to notice an approval, rare enough not to matter.
 */
export function NotificationBell() {
  const t = useTranslations();
  const [feed, setFeed] = useState<Feed>(EMPTY_FEED);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      setFeed(await res.json());
    } catch {
      // A failed poll is not worth interrupting the page for.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // The first fetch is deferred to its own task rather than run during the
    // commit, so this effect only ever schedules work.
    const initial = setTimeout(load, 0);
    const timer = setInterval(load, POLL_MS);

    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [load]);

  // Close on Escape or a click outside the bell
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    function handlePointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  async function markAllRead() {
    // Clear the badge immediately; the request only confirms it.
    setFeed((current) => ({
      unreadCount: 0,
      items: current.items.map((item) => ({ ...item, isRead: true })),
    }));

    try {
      await fetch("/api/notifications", { method: "PATCH" });
    } catch {
      load();
    }
  }

  const { items, unreadCount } = feed;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((open) => !open)}
        aria-label={t("notifications.open")}
        aria-expanded={isOpen}
        className="relative flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-600 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />

        {unreadCount > 0 ? (
          <span className="absolute top-1.5 end-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] font-bold text-white bg-accent rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute top-full end-0 mt-2 w-[min(22rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-lg z-50">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
            <h2 className="text-sm font-semibold text-gray-900">
              {t("notifications.title")}
            </h2>

            {unreadCount > 0 ? (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
              >
                <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                {t("notifications.markAllRead")}
              </button>
            ) : null}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2
                className="w-5 h-5 animate-spin text-gray-400"
                aria-hidden="true"
              />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <BellOff className="w-7 h-7 text-gray-300 mb-2" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">
                {t("notifications.empty")}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t("notifications.emptyDesc")}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((item) => (
                <li key={item.id}>
                  <NotificationRow item={item} onNavigate={() => setIsOpen(false)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function NotificationRow({
  item,
  onNavigate,
}: {
  item: NotificationItem;
  onNavigate: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const body = (
    <>
      <div className="flex items-start gap-2">
        {!item.isRead ? (
          <span
            className="w-2 h-2 mt-1.5 rounded-full bg-accent shrink-0"
            aria-hidden="true"
          />
        ) : (
          <span className="w-2 shrink-0" aria-hidden="true" />
        )}

        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {t(item.titleKey, item.params)}
          </p>
          <p className="text-sm text-gray-600 mt-0.5">
            {t(item.bodyKey, item.params)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatWhen(item.createdAt, locale)}
          </p>
        </div>
      </div>
    </>
  );

  const className = `block w-full text-start px-4 py-3 ${
    item.isRead ? "" : "bg-accent/5"
  }`;

  if (!item.link) {
    return <div className={className}>{body}</div>;
  }

  return (
    <Link
      href={item.link}
      onClick={onNavigate}
      className={`${className} hover:bg-gray-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none`}
    >
      {body}
    </Link>
  );
}

/** Short, absolute date — no relative-time library and no hydration drift. */
function formatWhen(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
