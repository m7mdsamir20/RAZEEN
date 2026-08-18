"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck, AlertTriangle, ScrollText } from "lucide-react";

interface Props {
  hasRestrictions: boolean;
  hasMortgage: boolean;
  hasWaqf: boolean;
  hasWill: boolean;
  registryRestrictions: string | null;
  obligations: string | null;
}

/**
 * The declared legal position of a listing. When nothing is flagged it says so
 * explicitly — silence would leave a buyer guessing whether it was answered.
 */
export function PropertyLegalStatus({
  hasRestrictions,
  hasMortgage,
  hasWaqf,
  hasWill,
  registryRestrictions,
  obligations,
}: Props) {
  const t = useTranslations();

  const flags = [
    { active: hasRestrictions, labelKey: "propertyExtra.hasRestrictions" },
    { active: hasMortgage, labelKey: "propertyExtra.hasMortgage" },
    { active: hasWaqf, labelKey: "propertyExtra.hasWaqf" },
    { active: hasWill, labelKey: "propertyExtra.hasWill" },
  ].filter((flag) => flag.active);

  const hasNotes = Boolean(registryRestrictions || obligations);

  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        {t("propertyExtra.legalSection")}
      </h2>

      {flags.length === 0 && !hasNotes ? (
        <p className="flex items-center gap-2 px-4 py-3 text-base text-green-800 bg-green-50 border border-green-100 rounded-xl">
          <ShieldCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
          {t("propertyExtra.legalClear")}
        </p>
      ) : (
        <div className="space-y-3">
          {flags.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {flags.map(({ labelKey }) => (
                <li
                  key={labelKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-full"
                >
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  {t(labelKey)}
                </li>
              ))}
            </ul>
          )}

          {registryRestrictions && (
            <LegalNote
              title={t("propertyExtra.registryRestrictions")}
              body={registryRestrictions}
            />
          )}

          {obligations && (
            <LegalNote
              title={t("propertyExtra.obligations")}
              body={obligations}
            />
          )}
        </div>
      )}
    </section>
  );
}

function LegalNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
      <ScrollText
        className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div>
        <p className="text-xs font-semibold text-gray-700">{title}</p>
        <p className="text-base text-gray-600 leading-relaxed mt-0.5 whitespace-pre-line">
          {body}
        </p>
      </div>
    </div>
  );
}
