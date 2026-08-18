import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MapPinOff, Home, Building2, Map, Search, Phone } from "lucide-react";

const LINKS = [
  { href: "/properties", labelKey: "nav.properties", Icon: Building2 },
  { href: "/map", labelKey: "nav.map", Icon: Map },
  { href: "/requests", labelKey: "nav.requests", Icon: Search },
  { href: "/contact", labelKey: "nav.contact", Icon: Phone },
] as const;

export default function NotFound() {
  const t = useTranslations();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
        <MapPinOff className="w-9 h-9 text-gray-400" aria-hidden="true" />
      </div>

      <p className="text-5xl font-bold text-primary mb-2">404</p>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
        {t("notFoundPage.title")}
      </h1>
      <p className="text-base text-gray-500 text-center max-w-md mb-7">
        {t("notFoundPage.description")}
      </p>

      <Link
        href="/"
        className="flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[48px] mb-8"
      >
        <Home className="w-5 h-5" aria-hidden="true" />
        {t("notFoundPage.goHome")}
      </Link>

      <nav aria-labelledby="helpful-links" className="w-full max-w-md">
        <h2
          id="helpful-links"
          className="text-sm font-medium text-gray-500 text-center mb-3"
        >
          {t("notFoundPage.helpfulLinks")}
        </h2>
        <ul className="grid grid-cols-2 gap-2">
          {LINKS.map(({ href, labelKey, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-[background-color,border-color,color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[48px]"
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {t(labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
