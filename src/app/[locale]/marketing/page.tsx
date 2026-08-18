import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  Megaphone,
  TrendingDown,
  Camera,
  PhoneOff,
  Radius,
  Handshake,
  FileSignature,
  ChartNoAxesCombined,
  Users,
  Sparkles,
  Filter,
  Scale,
  Target,
  Eye,
  ClipboardCheck,
  Repeat,
} from "lucide-react";
import { ServiceLanding } from "@/components/landing/ServiceLanding";
import { SITE_URL } from "@/lib/site";

const CHALLENGE_ICONS = [
  TrendingDown,
  Camera,
  PhoneOff,
  Radius,
  Handshake,
  FileSignature,
] as const;

const ADVANTAGE_ICONS = [
  ChartNoAxesCombined,
  Users,
  Sparkles,
  Filter,
  Scale,
  Target,
  Eye,
  ClipboardCheck,
  Repeat,
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("marketingLanding.metaTitle")} — ${t("common.appName")}`,
    description: t("marketingLanding.heroSubtitle"),
    alternates: {
      canonical: `${SITE_URL}/${locale}/marketing`,
      languages: {
        ar: `${SITE_URL}/ar/marketing`,
        en: `${SITE_URL}/en/marketing`,
      },
    },
  };
}

export default async function MarketingLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <ServiceLanding
      locale={locale}
      namespace="marketingLanding"
      ctaHref="/marketing/new"
      heroImage="/hero-riyadh.webp"
      heroIcon={Megaphone}
      challengeIcons={CHALLENGE_ICONS}
      advantageIcons={ADVANTAGE_ICONS}
    />
  );
}
