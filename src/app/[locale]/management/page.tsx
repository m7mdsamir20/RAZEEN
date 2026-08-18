import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  KeyRound,
  Clock,
  Search,
  Wrench,
  FileText,
  BarChart3,
  UserX,
  MapPinned,
  Eye,
  ShieldCheck,
  Hammer,
  Scale,
  TrendingUp,
  Wallet,
  Building2,
  Headset,
} from "lucide-react";
import { ServiceLanding } from "@/components/landing/ServiceLanding";
import { SITE_URL } from "@/lib/site";

const CHALLENGE_ICONS = [
  Clock,
  Search,
  Wrench,
  FileText,
  BarChart3,
  UserX,
] as const;

const ADVANTAGE_ICONS = [
  MapPinned,
  Eye,
  ShieldCheck,
  Hammer,
  Scale,
  TrendingUp,
  Wallet,
  Building2,
  Headset,
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("managementLanding.metaTitle")} — ${t("common.appName")}`,
    description: t("managementLanding.heroSubtitle"),
    alternates: {
      canonical: `${SITE_URL}/${locale}/management`,
      languages: {
        ar: `${SITE_URL}/ar/management`,
        en: `${SITE_URL}/en/management`,
      },
    },
  };
}

export default async function ManagementLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <ServiceLanding
      locale={locale}
      namespace="managementLanding"
      ctaHref="/management/new"
      heroImage="/hero-riyadh.webp"
      heroIcon={KeyRound}
      challengeIcons={CHALLENGE_ICONS}
      advantageIcons={ADVANTAGE_ICONS}
    />
  );
}
