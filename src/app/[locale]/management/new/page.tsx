import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ManagementForm } from "@/components/management/ManagementForm";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("newManagement.title")} — ${t("common.appName")}`,
    description: t("newManagement.subtitle"),
    alternates: {
      canonical: `${SITE_URL}/${locale}/management/new`,
      languages: {
        ar: `${SITE_URL}/ar/management/new`,
        en: `${SITE_URL}/en/management/new`,
      },
    },
  };
}

export default async function NewManagementRequestPage({
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
          {t("newManagement.title")}
        </h1>
        <p className="text-base text-gray-500">
          {t("newManagement.subtitle")}
        </p>
      </header>

      <ManagementForm />
    </div>
  );
}
