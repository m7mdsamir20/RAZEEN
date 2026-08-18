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

type Errors = Partial<Record<string, string>>;

export function ManagementForm() {
  const t = useTranslations();
  const { session, isLoading: isSessionLoading, refreshSession } =
    useSession();

  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [place, setPlace] = useState<LocationValue>({
    region: "",
    city: "",
    district: "",
  });
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
        title={t("newManagement.loginRequired")}
        description={t("newManagement.loginRequiredDesc")}
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
          {t("newManagement.successTitle")}
        </h2>
        <p className="text-base text-gray-500 max-w-sm mb-6">
          {t("newManagement.successDesc")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors min-h-[48px] flex items-center justify-center"
          >
            {t("newManagement.backHome")}
          </Link>
          <button
            onClick={() => {
              setIsDone(false);
              reset();
            }}
            className="px-6 py-3 text-base font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors min-h-[48px]"
          >
            {t("newManagement.addAnother")}
          </button>
        </div>
      </div>
    );
  }

  function reset() {
    setOwnerName("");
    setPhone("");
    setPropertyType("");
    setPlace({ region: "", city: "", district: "" });
    setNotes("");
    setErrors({});
    setSubmitError("");
  }

  function validate(): boolean {
    const next: Errors = {};

    if (ownerName.trim().length < 2)
      next.ownerName = t("newManagement.ownerNameRequired");
    if (!/^05\d{8}$/.test(phone)) next.phone = t("newManagement.phoneRequired");
    if (propertyType.trim().length < 2)
      next.propertyType = t("newManagement.propertyTypeRequired");
    if (place.city.trim().length < 2) next.city = t("validation.cityRequired");
    if (place.district.trim().length < 2)
      next.district = t("validation.districtRequired");

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: ownerName.trim(),
          phone,
          propertyType: propertyType.trim(),
          city: place.city.trim(),
          district: place.district.trim(),
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
            id="mgmt-owner"
            label={t("newManagement.ownerName")}
            error={errors.ownerName}
          >
            <input
              id="mgmt-owner"
              type="text"
              autoComplete="name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder={t("newManagement.ownerNamePlaceholder")}
              className={FIELD_CLASS}
              maxLength={100}
              aria-invalid={Boolean(errors.ownerName)}
            />
          </FormField>

          <FormField
            id="mgmt-phone"
            label={t("newManagement.phone")}
            error={errors.phone}
          >
            <input
              id="mgmt-phone"
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
          id="mgmt-type"
          label={t("newManagement.propertyType")}
          error={errors.propertyType}
        >
          <input
            id="mgmt-type"
            type="text"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            placeholder={t("newManagement.propertyTypePlaceholder")}
            className={FIELD_CLASS}
            maxLength={100}
            aria-invalid={Boolean(errors.propertyType)}
          />
        </FormField>

        <LocationSelects
          idPrefix="mgmt-"
          value={place}
          onChange={setPlace}
          errors={errors}
        />

        <FormField id="mgmt-notes" label={t("newManagement.notes")}>
          <textarea
            id="mgmt-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("newManagement.notesPlaceholder")}
            rows={5}
            maxLength={2000}
            className={`${FIELD_CLASS} resize-y`}
          />
        </FormField>
      </section>

      {submitError && (
        <p
          className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {submitError}
        </p>
      )}

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
          ? t("newManagement.submitting")
          : t("newManagement.submit")}
      </button>
    </form>
  );
}
