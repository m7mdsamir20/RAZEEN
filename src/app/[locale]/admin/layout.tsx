import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

/** The dashboard must never be indexed, whatever a child page declares. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { isAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/AdminNav";
import { Gate } from "@/components/ui/FormField";

/**
 * Authorises the whole /admin subtree in one place, so every page under it
 * inherits the same check rather than repeating it.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, allowed] = await Promise.all([params, isAdmin()]);
  const t = await getTranslations({ locale });

  if (!allowed) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <Gate
          icon={
            <ShieldAlert className="w-8 h-8 text-amber-500" aria-hidden="true" />
          }
          title={t("admin.accessDenied")}
          description={t("admin.accessDeniedDesc")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {t("admin.title")}
        </h1>
        <p className="text-base text-gray-500">{t("admin.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <AdminNav />
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
