import { getTranslations } from "next-intl/server";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Check, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { JsonLd } from "@/components/seo/JsonLd";

/**
 * Call-to-action styles, matching the home page hero exactly so the buttons
 * are the same across every landing page.
 */
// The transparent border keeps filled buttons exactly as tall as outlined
// ones, so the two sit level wherever they appear side by side.
const BUTTON_BASE =
  "flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-xl border border-transparent transition-colors focus-visible:outline-none min-h-[48px]";

const BUTTON_PRIMARY = `${BUTTON_BASE} text-white bg-primary hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/30`;

const BUTTON_ON_DARK = `${BUTTON_BASE} text-white border-white/40 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50`;

/** For the closing band, which is solid primary — a filled white button there. */
const BUTTON_ON_PRIMARY = `${BUTTON_BASE} text-primary bg-white hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/50`;

const BUTTON_OUTLINE = `${BUTTON_BASE} w-full text-primary border-primary/30 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/20`;

const STATS = ["stat1", "stat2", "stat3", "stat4"] as const;
const CHALLENGES = [
  "challenge1",
  "challenge2",
  "challenge3",
  "challenge4",
  "challenge5",
  "challenge6",
] as const;
const STEPS = ["step1", "step2", "step3", "step4"] as const;
const ADVANTAGES = [
  "advantage1",
  "advantage2",
  "advantage3",
  "advantage4",
  "advantage5",
  "advantage6",
  "advantage7",
  "advantage8",
  "advantage9",
] as const;
const FAQS = ["faq1", "faq2", "faq3", "faq4", "faq5", "faq6"] as const;

const TIER_1_FEATURES = [
  "tier1Feature1",
  "tier1Feature2",
  "tier1Feature3",
  "tier1Feature4",
  "tier1Feature5",
] as const;
const TIER_2_FEATURES = [
  "tier2Feature1",
  "tier2Feature2",
  "tier2Feature3",
  "tier2Feature4",
  "tier2Feature5",
  "tier2Feature6",
] as const;

interface ServiceLandingProps {
  locale: string;
  /** Translation namespace holding this service's copy. */
  namespace: string;
  /** Where every call to action leads — a sign-in protected form. */
  ctaHref: string;
  heroIcon: LucideIcon;
  /**
   * Background photo for the hero, in the same 2.4:1 panorama the home page
   * uses. The section keeps its brand colour underneath, so the hero still
   * reads correctly before the file is in place.
   */
  heroImage: string;
  /** One icon per challenge and per advantage, in order. */
  challengeIcons: readonly LucideIcon[];
  advantageIcons: readonly LucideIcon[];
}

/**
 * The shared shape of a service page: what the service is, who it is for, what
 * it costs in effort, and one way to ask for it.
 *
 * Both services tell the same story in the same order, so they share this
 * component and differ only in their copy and iconography. Everything here is
 * server-rendered so the page is fully crawlable; only the calls to action are
 * interactive, and they stay real links for that reason.
 */
export async function ServiceLanding({
  locale,
  namespace,
  ctaHref,
  heroIcon: HeroIcon,
  heroImage,
  challengeIcons,
  advantageIcons,
}: ServiceLandingProps) {
  const t = await getTranslations({ locale });
  const key = (name: string) => `${namespace}.${name}`;

  // The FAQ is the part search engines actually surface, so it is marked up.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: t(key(`${faq}Q`)),
      acceptedAnswer: { "@type": "Answer", text: t(key(`${faq}A`)) },
    })),
  };

  return (
    <>
      <JsonLd data={faqSchema} />

      {/* Hero — same geometry and scrim as the home page, so the three
          landing pages read as one site rather than three designs. */}
      <section className="relative overflow-hidden bg-primary text-white border-b border-gray-100">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div
          className="absolute inset-0 bg-gradient-to-b from-primary-dark/85 via-primary-dark/65 to-primary-dark/80"
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto px-4 py-14 sm:py-24 lg:py-32 lg:min-h-[560px] flex flex-col justify-center text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 text-sm font-medium bg-white/10 rounded-full mx-auto backdrop-blur-sm">
            <HeroIcon className="w-4 h-4" aria-hidden="true" />
            {t(key("heroBadge"))}
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white mb-3 drop-shadow-sm">
            {t(key("heroTitle"))}
          </h1>

          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            {t(key("heroSubtitle"))}
          </p>

          {/* No alignment override, so both buttons stretch to the same
              height — the outline one is a border taller on its own. */}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <ProtectedLink href={ctaHref} className={BUTTON_PRIMARY}>
              <HeroIcon className="w-5 h-5" aria-hidden="true" />
              {t(key("heroCta"))}
            </ProtectedLink>

            <Link href="/contact" className={BUTTON_ON_DARK}>
              <Phone className="w-5 h-5" aria-hidden="true" />
              {t(key("heroSecondary"))}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="sr-only">{t(key("statsTitle"))}</h2>
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Reversed so the figure reads above its label without
                repeating the label for screen readers. */}
            {STATS.map((stat) => (
              <div
                key={stat}
                className="flex flex-col-reverse items-center text-center"
              >
                <dt className="text-sm text-gray-500">
                  {t(key(`${stat}Label`))}
                </dt>
                <dd className="text-2xl sm:text-3xl font-bold text-primary mb-1">
                  {t(key(`${stat}Value`))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Challenges */}
      <section className="bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <SectionHeading
            title={t(key("challengesTitle"))}
            subtitle={t(key("challengesSubtitle"))}
          />

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHALLENGES.map((challenge, index) => {
              const Icon = challengeIcons[index];
              return (
                <li
                  key={challenge}
                  className="bg-white border border-gray-200 rounded-2xl p-5"
                >
                  <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-accent/10 mb-3">
                    <Icon className="w-5 h-5 text-accent" aria-hidden="true" />
                  </span>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {t(key(`${challenge}Title`))}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(key(`${challenge}Desc`))}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Packages */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <SectionHeading
            title={t(key("tiersTitle"))}
            subtitle={t(key("tiersSubtitle"))}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <article className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {t(key("tier1Name"))}
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                {t(key("tier1Tagline"))}
              </p>

              <ul className="space-y-3 mb-6">
                {TIER_1_FEATURES.map((feature) => (
                  <FeatureRow key={feature} text={t(key(feature))} />
                ))}
              </ul>

              <ProtectedLink href={ctaHref} className={BUTTON_OUTLINE}>
                {t(key("tierCta"))}
              </ProtectedLink>
            </article>

            <article className="bg-white border-2 border-primary rounded-2xl p-6 relative">
              <span className="absolute -top-3 end-6 px-3 py-1 text-xs font-semibold text-white bg-accent rounded-full">
                {t(key("tier2Badge"))}
              </span>

              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {t(key("tier2Name"))}
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                {t(key("tier2Tagline"))}
              </p>

              <ul className="space-y-3 mb-6">
                {TIER_2_FEATURES.map((feature) => (
                  <FeatureRow key={feature} text={t(key(feature))} />
                ))}
              </ul>

              <ProtectedLink href={ctaHref} className={`${BUTTON_PRIMARY} w-full`}>
                {t(key("tierCta"))}
              </ProtectedLink>
            </article>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <SectionHeading
            title={t(key("stepsTitle"))}
            subtitle={t(key("stepsSubtitle"))}
          />

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((step, index) => (
              <li
                key={step}
                className="bg-white border border-gray-200 rounded-2xl p-5"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white text-base font-bold mb-3">
                  {index + 1}
                </span>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {t(key(`${step}Title`))}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {t(key(`${step}Desc`))}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Advantages */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <SectionHeading
            title={t(key("advantagesTitle"))}
            subtitle={t(key("advantagesSubtitle"))}
          />

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADVANTAGES.map((advantage, index) => {
              const Icon = advantageIcons[index];
              return (
                <li
                  key={advantage}
                  className="flex gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-5"
                >
                  <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {t(key(`${advantage}Title`))}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {t(key(`${advantage}Desc`))}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-14">
          <SectionHeading title={t(key("faqTitle"))} />

          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq}
                className="group bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-3 px-5 py-4 text-base font-medium text-gray-900 cursor-pointer list-none min-h-[52px] hover:bg-gray-100 transition-colors">
                  {t(key(`${faq}Q`))}
                  <span
                    className="text-primary text-xl leading-none transition-transform group-open:rotate-45 shrink-0"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                  {t(key(`${faq}A`))}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-primary text-white">
        <div className="max-w-3xl mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            {t(key("ctaTitle"))}
          </h2>
          <p className="text-base text-white/80 mb-7 leading-relaxed">
            {t(key("ctaSubtitle"))}
          </p>

          <ProtectedLink
            href={ctaHref}
            className={`${BUTTON_ON_PRIMARY} inline-flex w-full sm:w-auto sm:mx-auto`}
          >
            <HeroIcon className="w-5 h-5" aria-hidden="true" />
            {t(key("ctaButton"))}
          </ProtectedLink>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-base text-gray-500 max-w-2xl mx-auto">{subtitle}</p>
      ) : null}
    </div>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="flex items-center justify-center w-5 h-5 shrink-0 mt-0.5 rounded-full bg-primary/10">
        <Check className="w-3 h-3 text-primary" aria-hidden="true" />
      </span>
      <span className="text-sm text-gray-700 leading-relaxed">{text}</span>
    </li>
  );
}
