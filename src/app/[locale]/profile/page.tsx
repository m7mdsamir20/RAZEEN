import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  User,
  Phone,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Heart,
  Search,
  LogIn,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";
import { getAccountOverview } from "@/lib/queries/account";
import { requiresNafath } from "@/lib/features";
import { Gate } from "@/components/ui/FormField";
import { SignInButton } from "@/components/auth/SignInButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("account.title")} — ${t("common.appName")}`,
    description: t("account.subtitle"),
  };
}

export default async function ProfilePage({
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

  const overview = await getAccountOverview(session.userId);

  if (!overview.user) {
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

  const { user, listingCounts, totalListings, requestCount, favoriteCount } =
    overview;

  const dateFormatter = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-GB",
    { year: "numeric", month: "long" }
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {t("account.title")}
        </h1>
        <p className="text-base text-gray-500">{t("account.subtitle")}</p>
      </header>

      <div className="space-y-6">
        {/* Profile */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("account.profile")}
          </h2>

          <dl className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <dt className="text-xs text-gray-500">{t("auth.name")}</dt>
                <dd className="text-base font-medium text-gray-900">
                  {user.name}
                </dd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <dt className="text-xs text-gray-500">{t("auth.phone")}</dt>
                <dd className="text-base font-medium text-gray-900" dir="ltr">
                  {user.phone}
                </dd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <dt className="text-xs text-gray-500">
                  {t("account.memberSince")}
                </dt>
                <dd className="text-base font-medium text-gray-900">
                  {dateFormatter.format(user.createdAt)}
                </dd>
              </div>
            </div>
          </dl>

          {/* Verification status — hidden while Nafath is not required */}
          {requiresNafath() && (
            <div
              className={`flex items-start gap-3 mt-5 p-4 rounded-xl ${
                user.isNafathVerified
                  ? "bg-green-50 border border-green-100"
                  : "bg-amber-50 border border-amber-100"
              }`}
            >
              {user.isNafathVerified ? (
                <ShieldCheck
                  className="w-5 h-5 text-green-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              ) : (
                <ShieldAlert
                  className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              )}
              <div>
                <p
                  className={`text-sm font-semibold ${
                    user.isNafathVerified ? "text-green-800" : "text-amber-800"
                  }`}
                >
                  {user.isNafathVerified
                    ? t("account.verified")
                    : t("account.notVerified")}
                </p>
                {!user.isNafathVerified && (
                  <p className="text-sm text-amber-700 mt-0.5">
                    {t("account.verifyNow")}
                  </p>
                )}
              </div>
            </div>
          )}

        </section>

        {/* Activity */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("account.activity")}
          </h2>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label={t("account.totalListings")}
              value={totalListings}
              tone="primary"
            />
            <StatCard
              label={t("account.approvedListings")}
              value={listingCounts.APPROVED}
              tone="green"
            />
            <StatCard
              label={t("account.pendingListings")}
              value={listingCounts.PENDING}
              tone="amber"
            />
            <StatCard
              label={t("account.rejectedListings")}
              value={listingCounts.REJECTED}
              tone="red"
            />
          </dl>
        </section>

        {/* Quick links */}
        <nav className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickLink
            href="/my-listings"
            icon={<FileText className="w-5 h-5" aria-hidden="true" />}
            label={t("header.myListings")}
            count={totalListings}
          />
          <QuickLink
            href="/requests"
            icon={<Search className="w-5 h-5" aria-hidden="true" />}
            label={t("account.myRequests")}
            count={requestCount}
          />
          <QuickLink
            href="/favorites"
            icon={<Heart className="w-5 h-5" aria-hidden="true" />}
            label={t("account.myFavorites")}
            count={favoriteCount}
          />
        </nav>
      </div>
    </div>
  );
}

const TONE_CLASSES = {
  primary: "text-primary",
  green: "text-green-600",
  amber: "text-amber-600",
  red: "text-red-600",
} as const;

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof TONE_CLASSES;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <dd className={`text-2xl font-bold ${TONE_CLASSES[tone]}`}>{value}</dd>
      <dt className="text-xs text-gray-500 mt-1">{label}</dt>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  count,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-4 bg-white border border-gray-200 rounded-2xl hover:border-primary/30 hover:bg-primary/5 transition-[background-color,border-color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[64px]"
    >
      <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-base font-medium text-gray-900">
          {label}
        </span>
        <span className="block text-sm text-gray-500">{count}</span>
      </span>
    </Link>
  );
}
