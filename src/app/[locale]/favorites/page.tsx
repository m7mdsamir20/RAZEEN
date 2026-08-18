import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Heart, LogIn } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";
import { getUserFavorites } from "@/lib/queries/account";
import { Gate } from "@/components/ui/FormField";
import { SignInButton } from "@/components/auth/SignInButton";
import { PropertyCard } from "@/components/property/PropertyCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("favorites.title")} — ${t("common.appName")}`,
    description: t("favorites.subtitle"),
  };
}

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, session] = await Promise.all([params, getSession()]);
  const t = await getTranslations({ locale });

  if (!session.isLoggedIn || !session.userId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <Gate
          icon={<LogIn className="w-8 h-8 text-gray-400" aria-hidden="true" />}
          title={t("account.signInTitle")}
          description={t("account.signInDesc")}
        >
          <SignInButton />
        </Gate>
      </div>
    );
  }

  const favorites = await getUserFavorites(session.userId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {t("favorites.title")}
        </h1>
        <p className="text-base text-gray-500">{t("favorites.subtitle")}</p>
      </header>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-gray-400" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {t("favorites.emptyTitle")}
          </h2>
          <p className="text-base text-gray-500 max-w-sm mb-6">
            {t("favorites.emptyDesc")}
          </p>
          <Link
            href="/properties"
            className="px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors min-h-[48px] flex items-center"
          >
            {t("favorites.browse")}
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {t("filters.resultsFound", { count: favorites.length })}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {favorites.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isFavorite
                // Un-favouriting here should drop the card from the list.
                refreshOnFavoriteToggle
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
