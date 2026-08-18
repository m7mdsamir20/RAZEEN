"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Building2,
  Search,
  PlusSquare,
  KeyRound,
  Megaphone,
  Mail,
} from "lucide-react";

const LINKS = [
  { href: "/admin", labelKey: "admin.nav.overview", Icon: LayoutDashboard },
  {
    href: "/admin/properties",
    labelKey: "admin.nav.properties",
    Icon: Building2,
  },
  { href: "/admin/requests", labelKey: "admin.nav.requests", Icon: Search },
  { href: "/admin/publish", labelKey: "admin.nav.publish", Icon: PlusSquare },
  {
    href: "/admin/management",
    labelKey: "admin.nav.management",
    Icon: KeyRound,
  },
  {
    href: "/admin/marketing",
    labelKey: "admin.nav.marketing",
    Icon: Megaphone,
  },
  { href: "/admin/messages", labelKey: "admin.nav.messages", Icon: Mail },
] as const;

export function AdminNav() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("admin.title")}
      className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible -mx-4 px-4 lg:mx-0 lg:px-0 pb-1 lg:pb-0"
    >
      {LINKS.map(({ href, labelKey, Icon }) => {
        // "/admin" would otherwise match every child route.
        const isActive =
          href === "/admin" ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-[background-color,color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px] ${
              isActive
                ? "bg-primary text-white"
                : "text-gray-700 hover:bg-gray-100 hover:text-primary"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
