"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Mail, Phone, MapPin } from "lucide-react";
import { CONTACT, localizedCity, localizedCountry } from "@/lib/site";

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-primary mb-3">
              {t("common.appName")}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              {t("home.heroSubtitle")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/properties"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  {t("nav.properties")}
                </Link>
              </li>
              <li>
                <Link
                  href="/map"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  {t("nav.map")}
                </Link>
              </li>
              <li>
                <Link
                  href="/requests"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  {t("nav.requests")}
                </Link>
              </li>
              <li>
                <Link
                  href="/marketing"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  {t("marketingLanding.metaTitle")}
                </Link>
              </li>
              <li>
                <Link
                  href="/management"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  {t("managementLanding.metaTitle")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  {t("nav.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              {t("footer.contactInfo")}
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                >
                  <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span dir="ltr">{CONTACT.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                >
                  <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span dir="ltr">{CONTACT.phoneDisplay}</span>
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {localizedCity(locale)}، {localizedCountry(locale)}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-400">
            © {year} {t("common.appName")}. {t("footer.rights")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
