"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Loader2, AlertCircle, CheckCircle2, LogIn, Send } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { SignInButton } from "@/components/auth/SignInButton";
import { FormField, Gate, FIELD_CLASS } from "@/components/ui/FormField";
import {
  LocationSelects,
  type LocationValue,
} from "@/components/location/LocationSelects";
import {
  PROPERTY_CATEGORIES,
  categoryLabelKey,
} from "@/lib/property-categories";

type Errors = Partial<Record<string, string>>;

/** Marketing the property to sell it, or to let it. */
const PURPOSES = ["SALE", "RENT"] as const;
type Purpose = (typeof PURPOSES)[number];

export function MarketingForm() {
  const t = useTranslations();
  const { session, isLoading: isSessionLoading, refreshSession } =
    useSession();

  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [category, setCategory] = useState<string>("RESIDENTIAL_APARTMENT");
  const [purpose, setPurpose] = useState<Purpose>("SALE");
  const [place, setPlace] = useState<LocationValue>({
    region: "",
    city: "",
    district: "",
  });
  const [area, setArea] = useState("");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (isSessionLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2
          className="w-6 h-6 animate-spin text-gray-400"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!session.isLoggedIn) {
    return (
      <Gate
        icon={<LogIn className="w-8 h-8 text-gray-400" aria-hidden="true" />}
        title={t("newMarketing.loginRequired")}
        description={t("newMarketing.loginRequiredDesc")}
      >
        <SignInButton onSignedIn={refreshSession} />
      </Gate>
    );
  }

  if (isDone) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {t("newMarketing.successTitle")}
        </h2>
        <p className="text-base text-gray-500 max-w-sm mb-6">
          {t("newMarketing.successDesc")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors min-h-[48px] flex items-center justify-center"
          >
            {t("newMarketing.backHome")}
          </Link>
          <button
            onClick={() => {
              setIsDone(false);
              reset();
            }}
            className="px-6 py-3 text-base font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors min-h-[48px]"
          >
            {t("newMarketing.addAnother")}
          </button>
        </div>
      </div>
    );
  }

  function reset() {
    setOwnerName("");
    setPhone("");
    setWhatsapp("");
    setCategory("RESIDENTIAL_APARTMENT");
    setPurpose("SALE");
    setPlace({ region: "", city: "", district: "" });
    setArea("");
    setExpectedPrice("");
    setNotes("");
    setErrors({});
    setSubmitError("");
  }

  function validate(): boolean {
    const next: Errors = {};

    if (ownerName.trim().length < 2)
      next.ownerName = t("newMarketing.ownerNameRequired");
    if (!/^05\d{8}$/.test(phone)) next.phone = t("newMarketing.phoneRequired");
    if (whatsapp && !/^05\d{8}$/.test(whatsapp))
      next.whatsapp = t("contact.phoneInvalid");
    if (place.city.trim().length < 2) next.city = t("validation.cityRequired");
    if (place.district.trim().length < 2)
      next.district = t("validation.districtRequired");

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /** Send a positive number, or omit the field entirely. */
  function optionalNumber(raw: string) {
    const value = Number(raw);
    return raw !== "" && Number.isFinite(value) && value > 0 ? value : undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const areaValue = optionalNumber(area);
      const priceValue = optionalNumber(expectedPrice);

      const res = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: ownerName.trim(),
          phone,
          ...(whatsapp ? { whatsapp } : {}),
          category,
          purpose,
          city: place.city.trim(),
          district: place.district.trim(),
          ...(place.region ? { region: place.region } : {}),
          ...(areaValue !== undefined ? { area: areaValue } : {}),
          ...(priceValue !== undefined ? { expectedPrice: priceValue } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? t("validation.generic"));
        return;
      }

      setIsDone(true);
    } catch {
      setSubmitError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="mkt-owner"
            label={t("newMarketing.ownerName")}
            error={errors.ownerName}
          >
            <input
              id="mkt-owner"
              type="text"
              autoComplete="name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder={t("newMarketing.ownerNamePlaceholder")}
              className={FIELD_CLASS}
              maxLength={100}
              aria-invalid={Boolean(errors.ownerName)}
            />
          </FormField>

          <FormField
            id="mkt-phone"
            label={t("newMarketing.phone")}
            error={errors.phone}
          >
            <input
              id="mkt-phone"
              type="tel"
              dir="ltr"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="05XXXXXXXX"
              className={FIELD_CLASS}
              aria-invalid={Boolean(errors.phone)}
            />
          </FormField>
        </div>

        <FormField
          id="mkt-whatsapp"
          label={t("newMarketing.whatsapp")}
          error={errors.whatsapp}
        >
          <input
            id="mkt-whatsapp"
            type="tel"
            dir="ltr"
            inputMode="numeric"
            value={whatsapp}
            onChange={(e) =>
              setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="05XXXXXXXX"
            className={FIELD_CLASS}
            aria-invalid={Boolean(errors.whatsapp)}
          />
        </FormField>
        <p className="text-xs text-gray-500 -mt-2">
          {t("newMarketing.whatsappHint")}
        </p>

        {/* Sell or let — changes what the team prepares, so it is asked up front */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("newMarketing.purposeLabel")}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {PURPOSES.map((value) => {
              const isActive = purpose === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPurpose(value)}
                  aria-pressed={isActive}
                  className={`min-h-[48px] px-4 py-3 text-base font-medium rounded-xl border transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none ${
                    isActive
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-700 border-gray-200 hover:border-primary/30"
                  }`}
                >
                  {value === "RENT"
                    ? t("newMarketing.purposeRent")
                    : t("newMarketing.purposeSale")}
                </button>
              );
            })}
          </div>
        </fieldset>

        <FormField id="mkt-category" label={t("property.category")}>
          <select
            id="mkt-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={FIELD_CLASS}
          >
            {PROPERTY_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {t(categoryLabelKey(value))}
              </option>
            ))}
          </select>
        </FormField>

        <LocationSelects
          idPrefix="mkt-"
          value={place}
          onChange={setPlace}
          errors={errors}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="mkt-area" label={t("newMarketing.areaLabel")}>
            <input
              id="mkt-area"
              type="number"
              inputMode="numeric"
              min={1}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="0"
              className={FIELD_CLASS}
            />
          </FormField>

          <FormField
            id="mkt-price"
            label={t("newMarketing.expectedPriceLabel")}
          >
            <input
              id="mkt-price"
              type="number"
              inputMode="numeric"
              min={1}
              value={expectedPrice}
              onChange={(e) => setExpectedPrice(e.target.value)}
              placeholder="0"
              className={FIELD_CLASS}
            />
          </FormField>
        </div>

        <FormField id="mkt-notes" label={t("newMarketing.notes")}>
          <textarea
            id="mkt-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("newMarketing.notesPlaceholder")}
            rows={5}
            maxLength={2000}
            className={`${FIELD_CLASS} resize-y`}
          />
        </FormField>
      </section>

      {submitError ? (
        <p
          className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 w-full px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[52px]"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="w-5 h-5" aria-hidden="true" />
        )}
        {isSubmitting
          ? t("newMarketing.submitting")
          : t("newMarketing.submit")}
      </button>
    </form>
  );
}
