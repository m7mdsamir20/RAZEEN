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
    title: `${t("admin.publishTitle")} — ${t("common.appName")}`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminPublishPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {t("admin.publishTitle")}
        </h2>
        <p className="text-base text-gray-500">{t("admin.publishSubtitle")}</p>
      </header>

      {/* The API decides publisher type and status from the session role, so
          the same form publishes straight to live for a company admin. */}
      <PropertyForm
        success={{
          titleKey: "admin.publishSuccessTitle",
          descriptionKey: "admin.publishSuccessDesc",
          linkHref: "/admin/properties",
          linkLabelKey: "admin.viewProperties",
        }}
      />
    </div>
  );
}
