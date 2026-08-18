import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  ShieldCheck,
  Eye,
  Award,
  HeartHandshake,
  Building2,
  Search,
  FileText,
  KeyRound,
  Target,
  Telescope,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("about.title")} — ${t("common.appName")}`,
    description: t("about.subtitle"),
    alternates: {
      canonical: `${SITE_URL}/${locale}/about`,
      languages: {
        ar: `${SITE_URL}/ar/about`,
        en: `${SITE_URL}/en/about`,
      },
    },
    openGraph: {
      title: `${t("about.title")} — ${t("common.appName")}`,
      description: t("about.subtitle"),
      url: `${SITE_URL}/${locale}/about`,
      type: "website",
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const values = [
    { Icon: ShieldCheck, key: "Trust" },
    { Icon: Eye, key: "Transparency" },
    { Icon: Award, key: "Quality" },
    { Icon: HeartHandshake, key: "Service" },
  ];

  const services = [
    { Icon: Building2, key: "Listing", href: "/properties/new" },
    { Icon: Search, key: "Search", href: "/properties" },
    { Icon: FileText, key: "Requests", href: "/requests" },
    { Icon: KeyRound, key: "Management", href: "/management/new" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {t("about.title")}
        </h1>
        <p className="text-base text-gray-500">{t("about.subtitle")}</p>
      </header>

      <div className="space-y-6">
        {/* Intro */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {t("about.introTitle")}
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            {t("about.intro")}
          </p>
        </section>

        {/* Mission + vision */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <span className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Target className="w-5 h-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t("about.missionTitle")}
            </h2>
            <p className="text-base text-gray-600 leading-relaxed">
              {t("about.mission")}
            </p>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-6">
            <span className="w-11 h-11 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-3">
              <Telescope className="w-5 h-5" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t("about.visionTitle")}
            </h2>
            <p className="text-base text-gray-600 leading-relaxed">
              {t("about.vision")}
            </p>
          </section>
        </div>

        {/* Values */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {t("about.valuesTitle")}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map(({ Icon, key }) => (
              <li
                key={key}
                className="flex gap-3 bg-white border border-gray-200 rounded-2xl p-5"
              >
                <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                    {t(`about.value${key}`)}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(`about.value${key}Desc`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Services */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {t("about.servicesTitle")}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map(({ Icon, key, href }) => (
              <li key={key}>
                <Link
                  href={href}
                  className="flex gap-3 h-full bg-white border border-gray-200 rounded-2xl p-5 hover:border-primary/30 hover:bg-primary/5 transition-[background-color,border-color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none"
                >
                  <span className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                      {t(`about.service${key}`)}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {t(`about.service${key}Desc`)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="bg-primary text-white rounded-2xl p-6 sm:p-8 text-center">
          <h2 className="text-xl font-bold mb-2">{t("about.ctaTitle")}</h2>
          <p className="text-base text-white/80 mb-6 max-w-md mx-auto">
            {t("about.ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/properties"
              className="px-6 py-3 text-base font-medium text-primary bg-white rounded-xl hover:bg-white/90 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none min-h-[48px] flex items-center justify-center"
            >
              {t("about.browseProperties")}
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 text-base font-medium text-white border border-white/40 rounded-xl hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none min-h-[48px] flex items-center justify-center"
            >
              {t("about.contactUs")}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
