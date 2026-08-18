import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { PropertyForm } from "@/components/property/PropertyForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("newProperty.title")} — ${t("common.appName")}`,
    description: t("newProperty.subtitle"),
  };
}

export default async function NewPropertyPage({
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
          {t("newProperty.title")}
        </h1>
        <p className="text-base text-gray-500">{t("newProperty.subtitle")}</p>
      </header>

      <PropertyForm />
    </div>
  );
}
