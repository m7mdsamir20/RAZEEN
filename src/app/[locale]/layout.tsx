import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Tajawal, Poppins } from "next/font/google";
import { routing } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/site";
import { organizationSchema } from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const title = `${t("common.appName")} — ${t("home.heroTitle")}`;
  const description = t("home.heroSubtitle");

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      // Pages set their own full title, so no suffix is appended twice.
      template: "%s",
    },
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        ar: `${SITE_URL}/ar`,
        en: `${SITE_URL}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      siteName: t("common.appName"),
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      images: [{ url: "/logo.png", alt: t("common.appName") }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/logo.png"],
    },
    robots: { index: true, follow: true },
  };
}

/**
 * Chosen to sit alongside the logo: Tajawal matches the geometric, open-
 * countered Arabic wordmark, and Poppins the wide-tracked Latin lockup.
 */
const tajawal = Tajawal({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-latin",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const [messages, t] = await Promise.all([
    getMessages(),
    getTranslations({ locale }),
  ]);
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${tajawal.variable} ${poppins.variable} min-h-screen flex flex-col antialiased`}
      >
        <JsonLd data={organizationSchema(locale, t("common.appName"))} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
