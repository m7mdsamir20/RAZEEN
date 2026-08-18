"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  Menu,
  X,
  LogIn,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { REQUIRES_NAFATH_CLIENT } from "@/lib/features";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";
import { ServiceMenu } from "./ServiceMenu";
import { NotificationBell } from "./NotificationBell";
import { LoginModal } from "../auth/LoginModal";

const NAV_LINKS = [
  { href: "/", label: "nav.home" },
  { href: "/properties", label: "nav.properties" },
  { href: "/map", label: "nav.map" },
  { href: "/requests", label: "nav.requests" },
  // Public service pages — site-wide links so they are discoverable and
  // crawlable, unlike the links inside the services dialog.
  { href: "/marketing", label: "nav.marketing" },
  { href: "/management", label: "nav.management" },
] as const;

export function Header() {
  const t = useTranslations();
  const { session, isLoading, refreshSession } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isNafathLoading, setIsNafathLoading] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    refreshSession();
  }

  async function handleNafath() {
    setIsNafathLoading(true);
    try {
      const res = await fetch("/api/auth/nafath", { method: "POST" });
      if (res.ok) {
        refreshSession();
      }
    } finally {
      setIsNafathLoading(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt={t("common.appName")}
                width={505}
                height={179}
                className="h-10 sm:h-12 w-auto"
                priority
                unoptimized
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] flex items-center"
                >
                  {t(label)}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2" aria-live="polite">
              {isLoading ? (
                <div className="w-8 h-8 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" aria-hidden="true" />
                </div>
              ) : session.isLoggedIn ? (
                <>
                  {/* Nafath prompt — only while verification is required */}
                  {REQUIRES_NAFATH_CLIENT && !session.isNafathVerified && (
                    <button
                      onClick={handleNafath}
                      disabled={isNafathLoading}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors min-h-[44px]"
                    >
                      {isNafathLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                      )}
                      {t("auth.verifyNafath")}
                    </button>
                  )}

                  {/* One entry point for all the services */}
                  <ServiceMenu />

                  <NotificationBell />

                  <UserMenu
                    name={session.name || session.phone || ""}
                    onLogout={handleLogout}
                    isAdmin={session.role === "COMPANY_ADMIN"}
                  />
                </>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors min-h-[44px]"
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  {t("auth.login")}
                </button>
              )}

              <LanguageSwitcher />
            </div>

            {/* Mobile: language + hamburger */}
            <div className="flex lg:hidden items-center gap-1">
              {session.isLoggedIn ? <NotificationBell /> : null}
              <LanguageSwitcher />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t(label)}
                </Link>
              ))}

              <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : session.isLoggedIn ? (
                  <>
                    {/* User info */}
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {session.name || session.phone}
                    </div>

                    {/* Nafath prompt — only while verification is required */}
                    {REQUIRES_NAFATH_CLIENT && !session.isNafathVerified && (
                      <button
                        onClick={() => {
                          handleNafath();
                          setIsMobileMenuOpen(false);
                        }}
                        disabled={isNafathLoading}
                        className="flex items-center gap-2 w-full px-3 py-3 text-base font-medium text-amber-700 bg-amber-50 rounded-lg min-h-[44px]"
                      >
                        {isNafathLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                        )}
                        {t("auth.verifyNafath")}
                      </button>
                    )}

                    {/* One entry point for all three services */}
                    <ServiceMenu className="w-full justify-center" />

                    {/* User links */}
                    <Link
                      href="/profile"
                      className="block px-3 py-3 text-base text-gray-700 hover:text-primary min-h-[44px]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t("header.myAccount")}
                    </Link>
                    <Link
                      href="/my-listings"
                      className="block px-3 py-3 text-base text-gray-700 hover:text-primary min-h-[44px]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t("header.myListings")}
                    </Link>
                    <Link
                      href="/favorites"
                      className="block px-3 py-3 text-base text-gray-700 hover:text-primary min-h-[44px]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t("header.favorites")}
                    </Link>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-3 text-base font-medium text-red-600 min-h-[44px]"
                    >
                      <LogIn className="w-5 h-5 rotate-180" aria-hidden="true" />
                      {t("auth.logout")}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsLoginOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-3 text-base font-medium text-white bg-primary rounded-lg min-h-[44px]"
                  >
                    <LogIn className="w-5 h-5" aria-hidden="true" />
                    {t("auth.login")}
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Login Modal — unmounted while closed so its steps reset on reopen */}
      {isLoginOpen ? (
        <LoginModal
          onClose={() => setIsLoginOpen(false)}
          onSuccess={refreshSession}
        />
      ) : null}
    </>
  );
}
