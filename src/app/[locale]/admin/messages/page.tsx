import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Inbox, Mail, Phone, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MessageActions } from "@/components/admin/MessageActions";
import { StatusFilter } from "@/components/admin/StatusFilter";

const STATUS_OPTIONS = [
  { value: "unread", labelKey: "messages.unread" },
  { value: "read", labelKey: "messages.read" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("messages.title")} — ${t("common.appName")}`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, resolved] = await Promise.all([params, searchParams]);

  const statusParam = Array.isArray(resolved.status)
    ? resolved.status[0]
    : resolved.status;

  const where =
    statusParam === "unread"
      ? { isRead: false }
      : statusParam === "read"
        ? { isRead: true }
        : {};

  const [t, messages] = await Promise.all([
    getTranslations({ locale }),
    prisma.contactMessage.findMany({
      where,
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
  ]);

  const dateFormatter = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-GB",
    { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
  );

  return (
    <div>
      <Suspense
        fallback={<div className="h-11 bg-gray-100 rounded-lg animate-pulse mb-4" />}
      >
        <StatusFilter statuses={STATUS_OPTIONS} />
      </Suspense>

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white border border-gray-200 rounded-2xl">
          <Inbox className="w-8 h-8 text-gray-300 mb-2" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {t("messages.emptyTitle")}
          </h2>
          <p className="text-base text-gray-500">{t("messages.emptyDesc")}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {messages.map((message) => (
            <li
              key={message.id}
              className={`bg-white border rounded-2xl overflow-hidden ${
                message.isRead ? "border-gray-200" : "border-primary/30"
              }`}
            >
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {!message.isRead && (
                    <span className="px-3 py-1 text-xs font-medium text-white bg-primary rounded-full">
                      {t("messages.newBadge")}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    {dateFormatter.format(message.createdAt)}
                  </span>
                </div>

                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  {message.subject}
                </h2>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm mb-3">
                  <span className="font-medium text-gray-900">
                    {message.name}
                  </span>
                  <a
                    href={`mailto:${message.email}`}
                    dir="ltr"
                    className="flex items-center gap-1.5 text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                  >
                    <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                    {message.email}
                  </a>
                  {message.phone && (
                    <a
                      href={`tel:${message.phone}`}
                      dir="ltr"
                      className="flex items-center gap-1.5 text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                    >
                      <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                      {message.phone}
                    </a>
                  )}
                </div>

                <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">
                  {message.message}
                </p>
              </div>

              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                <MessageActions id={message.id} isRead={message.isRead} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
