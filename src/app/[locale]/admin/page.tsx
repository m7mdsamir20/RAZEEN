import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  KeyRound,
  Megaphone,
  Users,
  BadgeCheck,
  ArrowLeft,
  Inbox,
  Mail,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getAdminOverview } from "@/lib/queries/admin";
import { Price } from "@/components/ui/Price";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("admin.title")} — ${t("common.appName")}`,
    robots: { index: false, follow: false },
  };
}

const TONES = {
  amber: "bg-amber-50 text-amber-700",
  green: "bg-green-50 text-green-700",
  red: "bg-red-50 text-red-700",
  primary: "bg-primary/10 text-primary",
  slate: "bg-gray-100 text-gray-700",
} as const;

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [t, overview] = await Promise.all([
    getTranslations({ locale }),
    getAdminOverview(),
  ]);

  const dateFormatter = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-GB",
    { year: "numeric", month: "short", day: "numeric" }
  );

  const stats = [
    {
      labelKey: "admin.stats.pendingProperties",
      value: overview.properties.PENDING,
      Icon: Clock,
      tone: "amber" as const,
      href: "/admin/properties?status=PENDING",
    },
    {
      labelKey: "admin.stats.approvedProperties",
      value: overview.properties.APPROVED,
      Icon: CheckCircle2,
      tone: "green" as const,
      href: "/admin/properties?status=APPROVED",
    },
    {
      labelKey: "admin.stats.rejectedProperties",
      value: overview.properties.REJECTED,
      Icon: XCircle,
      tone: "red" as const,
      href: "/admin/properties?status=REJECTED",
    },
    {
      labelKey: "admin.stats.pendingRequests",
      value: overview.requests.PENDING,
      Icon: Search,
      tone: "amber" as const,
      href: "/admin/requests?status=PENDING",
    },
    {
      labelKey: "admin.stats.approvedRequests",
      value: overview.requests.APPROVED,
      Icon: CheckCircle2,
      tone: "green" as const,
      href: "/admin/requests?status=APPROVED",
    },
    {
      labelKey: "admin.stats.newManagement",
      value: overview.management.NEW,
      Icon: KeyRound,
      tone: "primary" as const,
      href: "/admin/management?status=NEW",
    },
    {
      labelKey: "admin.stats.newMarketing",
      value: overview.marketing.NEW,
      Icon: Megaphone,
      tone: "primary" as const,
      href: "/admin/marketing?status=NEW",
    },
    {
      labelKey: "admin.stats.unreadMessages",
      value: overview.unreadMessageCount,
      Icon: Mail,
      tone: "primary" as const,
      href: "/admin/messages?status=unread",
    },
    {
      labelKey: "admin.stats.users",
      value: overview.userCount,
      Icon: Users,
      tone: "slate" as const,
    },
    {
      labelKey: "admin.stats.verifiedUsers",
      value: overview.verifiedUserCount,
      Icon: BadgeCheck,
      tone: "slate" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <section>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(({ labelKey, value, Icon, tone, href }) => {
            const card = (
              <>
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${TONES[tone]}`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-2xl font-bold text-gray-900">
                    {value}
                  </span>
                  <span className="block text-xs text-gray-500 leading-snug">
                    {t(labelKey)}
                  </span>
                </span>
              </>
            );

            return (
              <li key={labelKey}>
                {href ? (
                  <Link
                    href={href}
                    className="flex items-center gap-3 p-4 h-full bg-white border border-gray-200 rounded-2xl hover:border-primary/30 hover:bg-primary/5 transition-[background-color,border-color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none"
                  >
                    {card}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 p-4 h-full bg-white border border-gray-200 rounded-2xl">
                    {card}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Pending queue preview */}
      <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {t("admin.recentPending")}
          </h2>
          <Link
            href="/admin/properties?status=PENDING"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
          >
            {t("admin.reviewAll")}
            <ArrowLeft
              className="w-4 h-4 rtl:rotate-0 ltr:rotate-180"
              aria-hidden="true"
            />
          </Link>
        </div>

        {overview.recentProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Inbox className="w-8 h-8 text-gray-300 mb-2" aria-hidden="true" />
            <p className="text-sm text-gray-500">{t("admin.nothingPending")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {overview.recentProperties.map((property) => (
              <li
                key={property.id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {property.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {property.user.name} · {property.district}، {property.city}{" "}
                    · {dateFormatter.format(property.createdAt)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary shrink-0">
                  <Price amount={property.price} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
