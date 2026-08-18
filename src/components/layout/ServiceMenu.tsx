"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Plus,
  Search,
  KeyRound,
  Megaphone,
  X,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

const SERVICES = [
  {
    href: "/properties/new",
    titleKey: "services.addListing",
    descKey: "services.addListingDesc",
    Icon: Plus,
  },
  {
    href: "/requests/new",
    titleKey: "services.requestProperty",
    descKey: "services.requestPropertyDesc",
    Icon: Search,
  },
  {
    href: "/marketing/new",
    titleKey: "services.marketProperty",
    descKey: "services.marketPropertyDesc",
    Icon: Megaphone,
  },
  {
    href: "/management/new",
    titleKey: "services.requestManagement",
    descKey: "services.requestManagementDesc",
    Icon: KeyRound,
  },
] as const;

/**
 * One header button that opens a chooser for the three services, replacing
 * the row of three buttons that crowded the header.
 */
export function ServiceMenu({ className = "" }: { className?: string }) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[44px] ${className}`}
      >
        <Sparkles className="w-4 h-4" aria-hidden="true" />
        {t("services.trigger")}
      </button>

      {isOpen ? <ServiceDialog onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}

function ServiceDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape, and lock background scrolling while open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overscroll-contain"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-dialog-title"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div>
            <h2
              id="service-dialog-title"
              className="text-lg font-semibold text-gray-900"
            >
              {t("services.title")}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {t("services.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("services.close")}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-[color,background-color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <ul className="p-5 space-y-3">
          {SERVICES.map(({ href, titleKey, descKey, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onClose}
                className="group flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-[background-color,border-color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none"
              >
                <span className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-base font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {t(titleKey)}
                  </span>
                  <span className="block text-sm text-gray-500 leading-relaxed mt-0.5">
                    {t(descKey)}
                  </span>
                </span>
                <ArrowLeft
                  className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors shrink-0 mt-3 rtl:rotate-0 ltr:rotate-180"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
