"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  User,
  FileText,
  Heart,
  LogOut,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";

interface UserMenuProps {
  name: string;
  onLogout: () => void;
  /** Company admins get a link into the dashboard. */
  isAdmin?: boolean;
}

export function UserMenu({ name, onLogout, isAdmin = false }: UserMenuProps) {
  const t = useTranslations("header");
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-100 transition-[color,background-color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px]"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <User className="w-5 h-5" />
        <span className="hidden sm:inline max-w-[120px] truncate">
          {name}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute end-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {isAdmin && (
            <>
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors min-h-[44px]"
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                {t("dashboard")}
              </Link>
              <div className="border-t border-gray-100 my-1" />
            </>
          )}

          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
            onClick={() => setIsOpen(false)}
          >
            <User className="w-4 h-4" />
            {t("myAccount")}
          </Link>
          <Link
            href="/my-listings"
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
            onClick={() => setIsOpen(false)}
          >
            <FileText className="w-4 h-4" />
            {t("myListings")}
          </Link>
          <Link
            href="/favorites"
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
            onClick={() => setIsOpen(false)}
          >
            <Heart className="w-4 h-4" />
            {t("favorites")}
          </Link>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}
