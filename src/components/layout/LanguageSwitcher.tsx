"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("header");
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary rounded-lg hover:bg-gray-100 transition-[color,background-color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px]"
      aria-label={t("switchLang")}
    >
      <Globe className="w-4 h-4" />
      <span>{t("switchLang")}</span>
    </button>
  );
}
