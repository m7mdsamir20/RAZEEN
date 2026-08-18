import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { FileWarning } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Gate } from "@/components/ui/FormField";
import { EditPropertyForm } from "@/components/property/EditPropertyForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("editProperty.title")} — ${t("common.appName")}`,
    robots: { index: false, follow: false },
  };
}

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const [{ locale, id }, session] = await Promise.all([params, getSession()]);
  const t = await getTranslations({ locale });

  // Scope the lookup to the owner (or an admin) so a wrong id and someone
  // else's listing are indistinguishable from outside.
  const property =
    session.isLoggedIn && session.userId
      ? await prisma.property.findFirst({
          where: {
            id,
            ...(session.role === "COMPANY_ADMIN"
              ? {}
              : { userId: session.userId }),
          },
        })
      : null;

  if (!property) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <Gate
          icon={
            <FileWarning className="w-8 h-8 text-gray-400" aria-hidden="true" />
          }
          title={t("editProperty.notFound")}
          description={t("editProperty.notFoundDesc")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {t("editProperty.title")}
        </h1>
        <p className="text-base text-gray-500">{t("editProperty.subtitle")}</p>
      </header>

      <EditPropertyForm property={property} />
    </div>
  );
}
