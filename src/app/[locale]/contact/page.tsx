import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Mail, Phone, MessageCircle, MapPin, Clock } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";
import { CONTACT, SITE_URL, fullAddress, localizedHours } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("contact.title")} — ${t("common.appName")}`,
    description: t("contact.subtitle"),
    alternates: {
      canonical: `${SITE_URL}/${locale}/contact`,
      languages: {
        ar: `${SITE_URL}/ar/contact`,
        en: `${SITE_URL}/en/contact`,
      },
    },
    openGraph: {
      title: `${t("contact.title")} — ${t("common.appName")}`,
      description: t("contact.subtitle"),
      url: `${SITE_URL}/${locale}/contact`,
      type: "website",
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const details = [
    {
      Icon: Mail,
      label: t("contact.email"),
      value: CONTACT.email,
      href: `mailto:${CONTACT.email}`,
      ltr: true,
    },
    {
      Icon: Phone,
      label: t("contact.phone"),
      value: CONTACT.phoneDisplay,
      href: `tel:${CONTACT.phone}`,
      ltr: true,
    },
    {
      Icon: MessageCircle,
      label: t("contact.whatsapp"),
      value: CONTACT.phoneDisplay,
      href: `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`,
      ltr: true,
    },
    {
      Icon: MapPin,
      label: t("contact.address"),
      value: fullAddress(locale),
      href: null,
      ltr: false,
    },
    {
      Icon: Clock,
      label: t("contact.hours"),
      value: localizedHours(locale),
      href: null,
      ltr: false,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {t("contact.title")}
        </h1>
        <p className="text-base text-gray-500">{t("contact.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("contact.infoTitle")}
            </h2>

            <dl className="space-y-4">
              {details.map(({ Icon, label, value, href, ltr }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="text-base text-gray-900 break-words">
                      {href ? (
                        <a
                          href={href}
                          dir={ltr ? "ltr" : undefined}
                          className="inline-block text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                          {...(href.startsWith("http")
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                        >
                          {value}
                        </a>
                      ) : (
                        <span dir={ltr ? "ltr" : undefined}>{value}</span>
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </aside>

        <section>
          <ContactForm />
        </section>
      </div>
    </div>
  );
}
