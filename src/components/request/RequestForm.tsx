"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  LogIn,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { SignInButton } from "@/components/auth/SignInButton";
import { REQUIRES_NAFATH_CLIENT } from "@/lib/features";
import { FormField, Gate, FIELD_CLASS } from "@/components/ui/FormField";
import {
  LocationSelects,
  type LocationValue,
} from "@/components/location/LocationSelects";
import {
  LocationPicker,
  type PickedLocation,
  type ResolvedPlace,
} from "@/components/map/LocationPicker";
import {
  RoomCountFields,
  roomCountsPayload,
  EMPTY_ROOM_COUNTS,
  type RoomCounts,
} from "@/components/property/RoomCountFields";
import {
  PROPERTY_CATEGORIES,
  categoryLabelKey,
  fieldsFor,
} from "@/lib/property-categories";
import { Price } from "@/components/ui/Price";
import { regionLabelForValue } from "@/lib/saudi-locations";

type Errors = Partial<Record<string, string>>;

/** Buying or renting — decides the wording of the budget field. */
const PURPOSES = ["SALE", "RENT"] as const;
type Purpose = (typeof PURPOSES)[number];

export function RequestForm() {
  const t = useTranslations();
  const locale = useLocale();
  const { session, isLoading: isSessionLoading, refreshSession } =
    useSession();

  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState<Purpose>("SALE");
  const [category, setCategory] = useState<string>("RESIDENTIAL_APARTMENT");
  const [rooms, setRooms] = useState<RoomCounts>(EMPTY_ROOM_COUNTS);
  const [place, setPlace] = useState<LocationValue>({
    region: "",
    city: "",
    district: "",
  });
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [formattedAddress, setFormattedAddress] = useState("");
  const [budget, setBudget] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [ageYears, setAgeYears] = useState("");

  // The form is filled in one step and confirmed in another; nothing is sent
  // until the requester has seen the summary.
  const [isReviewing, setIsReviewing] = useState(false);
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
        title={t("newRequest.loginRequired")}
        description={t("newRequest.loginRequiredDesc")}
      >
        <SignInButton onSignedIn={refreshSession} />
      </Gate>
    );
  }

  if (REQUIRES_NAFATH_CLIENT && !session.isNafathVerified) {
    return (
      <Gate
        icon={
          <ShieldAlert className="w-8 h-8 text-amber-500" aria-hidden="true" />
        }
        title={t("newRequest.nafathRequired")}
        description={t("newRequest.nafathRequiredDesc")}
      />
    );
  }

  if (isDone) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {t("newRequest.successTitle")}
        </h2>
        <p className="text-base text-gray-500 max-w-sm mb-6">
          {t("newRequest.successDesc")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/requests"
            className="px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors min-h-[48px] flex items-center justify-center"
          >
            {t("newRequest.viewRequests")}
          </Link>
          <button
            onClick={() => {
              setIsDone(false);
              resetForm();
            }}
            className="px-6 py-3 text-base font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors min-h-[48px]"
          >
            {t("newRequest.addAnother")}
          </button>
        </div>
      </div>
    );
  }

  function resetForm() {
    setTitle("");
    setPurpose("SALE");
    setCategory("RESIDENTIAL_APARTMENT");
    setRooms(EMPTY_ROOM_COUNTS);
    setPlace({ region: "", city: "", district: "" });
    setLocation(null);
    setFormattedAddress("");
    setBudget("");
    setWhatsapp("");
    setAgeYears("");
    setIsReviewing(false);
    setErrors({});
    setSubmitError("");
  }

  /**
   * Fill region, city and district from the map pin, without overwriting a
   * district the requester typed deliberately.
   */
  function applyResolvedAddress(resolved: ResolvedPlace) {
    setFormattedAddress(resolved.formattedAddress);

    setPlace((current) => ({
      region: resolved.region ?? current.region,
      city: resolved.city ?? current.city,
      district: current.district || (resolved.district ?? ""),
    }));
  }

  function validate(): boolean {
    const next: Errors = {};

    if (title.trim().length < 5) next.title = t("validation.titleMin");
    if (place.city.trim().length < 2) next.city = t("validation.cityRequired");
    if (place.district.trim().length < 2)
      next.district = t("validation.districtRequired");
    if (!budget || Number(budget) <= 0)
      next.budget = t("newRequest.budgetRequired");
    if (whatsapp && !/^05\d{8}$/.test(whatsapp))
      next.whatsapp = t("contact.phoneInvalid");

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /** Step one → step two. Nothing is sent here. */
  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setIsReviewing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type: purpose,
          category,
          ...roomCountsPayload(category, rooms),
          city: place.city.trim(),
          district: place.district.trim(),
          ...(place.region ? { region: place.region } : {}),
          ...(location
            ? { latitude: location.lat, longitude: location.lng }
            : {}),
          ...(formattedAddress ? { formattedAddress } : {}),
          budget: Number(budget),
          ...(whatsapp ? { whatsapp } : {}),
          ...(ageYears !== "" && Number.isFinite(Number(ageYears))
            ? { ageYears: Number(ageYears) }
            : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Send them back to the fields so the problem can actually be fixed.
        setIsReviewing(false);
        setSubmitError(data.error ?? t("validation.generic"));
        return;
      }

      setIsDone(true);
    } catch {
      setIsReviewing(false);
      setSubmitError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const budgetLabel =
    purpose === "RENT"
      ? t("newRequest.budgetLabelRent")
      : t("newRequest.budgetLabelSale");

  if (isReviewing) {
    return (
      <ReviewStep
        rows={buildReviewRows()}
        error={submitError}
        isSubmitting={isSubmitting}
        onBack={() => setIsReviewing(false)}
        onConfirm={handleSubmit}
      />
    );
  }

  /** The summary shown on the confirmation step. */
  function buildReviewRows() {
    const fields = fieldsFor(category);
    const counts = roomCountsPayload(category, rooms);
    const dash = t("newRequest.notProvided");

    return [
      { label: t("property.title"), value: title.trim() },
      {
        label: t("newRequest.purposeLabel"),
        value:
          purpose === "RENT"
            ? t("newRequest.purposeRent")
            : t("newRequest.purposeBuy"),
      },
      { label: t("property.category"), value: t(categoryLabelKey(category)) },
      ...(fields.bedrooms
        ? [{ label: t("property.bedrooms"), value: String(counts.bedrooms) }]
        : []),
      ...(fields.livingRooms
        ? [
            {
              label: t("property.livingRooms"),
              value: String(counts.livingRooms),
            },
          ]
        : []),
      ...(fields.halls
        ? [{ label: t("property.halls"), value: String(counts.halls) }]
        : []),
      ...(fields.bathrooms
        ? [{ label: t("property.bathrooms"), value: String(counts.bathrooms) }]
        : []),
      {
        label: t("property.city"),
        value: `${place.district}، ${place.city}`,
      },
      ...(place.region
        ? [
            {
              label: t("location.region"),
              value: regionLabelForValue(place.region, locale),
            },
          ]
        : []),
      {
        label: t("locationPicker.label"),
        value: location
          ? formattedAddress || t("newRequest.mapSelected")
          : t("newRequest.mapNotSelected"),
      },
      { label: budgetLabel, node: <Price amount={Number(budget)} /> },
      ...(ageYears !== ""
        ? [{ label: t("propertyExtra.age"), value: ageYears }]
        : []),
      { label: t("propertyExtra.whatsapp"), value: whatsapp || dash },
    ];
  }

  return (
    <form onSubmit={handleReview} noValidate className="space-y-6">
      <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("newRequest.detailsSection")}
        </h2>

        <FormField
          id="request-title"
          label={t("property.title")}
          error={errors.title}
        >
          <input
            id="request-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("newRequest.titlePlaceholder")}
            className={FIELD_CLASS}
            maxLength={200}
            aria-invalid={Boolean(errors.title)}
          />
        </FormField>

        {/* Buy or rent — a segmented control rather than a select, since
            it changes the wording of the budget field below */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-1.5">
            {t("newRequest.purposeLabel")}
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
                    ? t("newRequest.purposeRent")
                    : t("newRequest.purposeBuy")}
                </button>
              );
            })}
          </div>
        </fieldset>

        <FormField id="request-category" label={t("property.category")}>
          <select
            id="request-category"
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

        {/* Room counts, shown only for the categories that have them */}
        <RoomCountFields
          idPrefix="request-"
          category={category}
          value={rooms}
          onChange={setRooms}
        />

        <FormField
          id="request-budget"
          label={budgetLabel}
          error={errors.budget}
        >
          <input
            id="request-budget"
            type="number"
            inputMode="numeric"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="0"
            min={1}
            className={FIELD_CLASS}
            aria-invalid={Boolean(errors.budget)}
          />
        </FormField>

        <FormField id="request-age" label={t("propertyExtra.age")}>
          <input
            id="request-age"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={ageYears}
            onChange={(e) => setAgeYears(e.target.value)}
            placeholder={t("propertyExtra.agePlaceholder")}
            className={FIELD_CLASS}
          />
        </FormField>
      </section>

      {/* Location */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("newRequest.locationSection")}
        </h2>

        <LocationSelects
          idPrefix="request-"
          value={place}
          onChange={setPlace}
          errors={errors}
        />

        <div className="mt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
            <span className="text-sm font-medium text-gray-700">
              {t("locationPicker.label")}
            </span>
            <span className="text-xs text-gray-500">
              {t("locationPicker.optional")}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            {t("newRequest.mapHint")}
          </p>

          <LocationPicker
            value={location}
            onChange={setLocation}
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
            onResolveAddress={applyResolvedAddress}
          />
        </div>
      </section>

      {/* Contact */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("newRequest.contactSection")}
        </h2>

        <FormField
          id="request-whatsapp"
          label={t("propertyExtra.whatsapp")}
          error={errors.whatsapp}
        >
          <input
            id="request-whatsapp"
            type="tel"
            dir="ltr"
            inputMode="numeric"
            autoComplete="tel"
            value={whatsapp}
            onChange={(e) =>
              setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="05XXXXXXXX"
            className={FIELD_CLASS}
            aria-invalid={Boolean(errors.whatsapp)}
          />
        </FormField>

        <p className="text-xs text-gray-500 mt-2">
          {t("propertyExtra.whatsappHint")}
        </p>
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
        className="flex items-center justify-center gap-2 w-full px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[52px]"
      >
        {t("newRequest.reviewButton")}
      </button>
    </form>
  );
}

interface ReviewRow {
  label: string;
  value?: string;
  node?: React.ReactNode;
}

/**
 * The confirmation step: a plain summary of everything about to be sent, with
 * one way back to the fields and one way forward.
 */
function ReviewStep({
  rows,
  error,
  isSubmitting,
  onBack,
  onConfirm,
}: {
  rows: ReviewRow[];
  error: string;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {t("newRequest.reviewTitle")}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {t("newRequest.reviewDesc")}
        </p>

        <dl className="divide-y divide-gray-100">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-baseline justify-between gap-2 py-3"
            >
              <dt className="text-sm text-gray-500">{row.label}</dt>
              <dd className="text-base font-medium text-gray-900 text-end">
                {row.node ?? row.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {error ? (
        <p
          className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[52px] sm:w-auto"
        >
          <Pencil className="w-4 h-4" aria-hidden="true" />
          {t("newRequest.backToEdit")}
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 flex-1 px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[52px]"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
          )}
          {isSubmitting
            ? t("newRequest.submitting")
            : t("newRequest.confirmSubmit")}
        </button>
      </div>
    </div>
  );
}
