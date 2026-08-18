import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { MarketingForm } from "@/components/marketing/MarketingForm";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("newMarketing.title")} — ${t("common.appName")}`,
    description: t("newMarketing.subtitle"),
    alternates: {
      canonical: `${SITE_URL}/${locale}/marketing/new`,
      languages: {
        ar: `${SITE_URL}/ar/marketing/new`,
        en: `${SITE_URL}/en/marketing/new`,
      },
    },
  };
}

export default async function NewMarketingRequestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {t("newMarketing.title")}
        </h1>
        <p className="text-base text-gray-500">{t("newMarketing.subtitle")}</p>
      </header>

      <MarketingForm />
    </div>
  );
}
