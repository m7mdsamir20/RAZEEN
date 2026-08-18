"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Loader2, AlertCircle, CheckCircle2, ShieldAlert, LogIn } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { SignInButton } from "@/components/auth/SignInButton";
import { REQUIRES_NAFATH_CLIENT } from "@/lib/features";
import { FormField, Gate, FIELD_CLASS } from "@/components/ui/FormField";
import {
  MediaUploader,
  splitMedia,
  revokeMedia,
  type PendingMedia,
} from "./MediaUploader";
import {
  LocationPicker,
  type PickedLocation,
  type ResolvedPlace,
} from "@/components/map/LocationPicker";
import {
  PropertyExtraFields,
  EMPTY_EXTRA_FIELDS,
  extraFieldsPayload,
  type ExtraFieldsValue,
} from "./PropertyExtraFields";
import {
  LocationSelects,
  type LocationValue,
} from "@/components/location/LocationSelects";
import { PROPERTY_TYPES } from "@/types";
import {
  PROPERTY_CATEGORIES,
  categoryLabelKey,
} from "@/lib/property-categories";
import {
  RoomCountFields,
  roomCountsPayload,
  EMPTY_ROOM_COUNTS,
  type RoomCounts,
} from "./RoomCountFields";

type Errors = Partial<Record<string, string>>;

interface PropertyFormProps {
  /**
   * Copy shown after a successful publish. Company admins publish straight to
   * live, so they get different wording and a different follow-up link than a
   * user whose listing goes into the review queue.
   */
  success?: {
    titleKey: string;
    descriptionKey: string;
    linkHref: string;
    linkLabelKey: string;
  };
}

const DEFAULT_SUCCESS = {
  titleKey: "newProperty.successTitle",
  descriptionKey: "newProperty.successDesc",
  linkHref: "/my-listings",
  linkLabelKey: "newProperty.viewMyListings",
};

export function PropertyForm({
  success = DEFAULT_SUCCESS,
}: PropertyFormProps = {}) {
  const t = useTranslations();
  const router = useRouter();
  const { session, isLoading: isSessionLoading, refreshSession } =
    useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("RESIDENTIAL_APARTMENT");
  const [type, setType] = useState<string>("RENT");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [rooms, setRooms] = useState<RoomCounts>(EMPTY_ROOM_COUNTS);
  const [place, setPlace] = useState<LocationValue>({
    region: "",
    city: "",
    district: "",
  });
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [formattedAddress, setFormattedAddress] = useState("");
  const [extra, setExtra] = useState<ExtraFieldsValue>(EMPTY_EXTRA_FIELDS);
  const [media, setMedia] = useState<PendingMedia[]>([]);

  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Gate: must be signed in and Nafath verified.
  if (isSessionLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" aria-hidden="true" />
      </div>
    );
  }

  if (!session.isLoggedIn) {
    return (
      <Gate
        icon={<LogIn className="w-8 h-8 text-gray-400" aria-hidden="true" />}
        title={t("newProperty.loginRequired")}
        description={t("newProperty.loginRequiredDesc")}
      >
        <SignInButton onSignedIn={refreshSession} />
      </Gate>
    );
  }

  if (REQUIRES_NAFATH_CLIENT && !session.isNafathVerified) {
    return (
      <Gate
        icon={<ShieldAlert className="w-8 h-8 text-amber-500" aria-hidden="true" />}
        title={t("newProperty.nafathRequired")}
        description={t("newProperty.nafathRequiredDesc")}
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
          {t(success.titleKey)}
        </h2>
        <p className="text-base text-gray-500 max-w-sm mb-6">
          {t(success.descriptionKey)}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={success.linkHref}
            className="px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors min-h-[48px] flex items-center justify-center"
          >
            {t(success.linkLabelKey)}
          </Link>
          <button
            onClick={() => {
              setIsDone(false);
              resetForm();
            }}
            className="px-6 py-3 text-base font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors min-h-[48px]"
          >
            {t("newProperty.addAnother")}
          </button>
        </div>
      </div>
    );
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("RESIDENTIAL_APARTMENT");
    setType("RENT");
    setPrice("");
    setArea("");
    setRooms(EMPTY_ROOM_COUNTS);
    setPlace({ region: "", city: "", district: "" });
    setLocation(null);
    setFormattedAddress("");
    setExtra(EMPTY_EXTRA_FIELDS);
    revokeMedia(media);
    setMedia([]);
    setErrors({});
    setSubmitError("");
  }

  /**
   * Fill region, city and district from the map pin. Only overwrites fields
   * the publisher has not already filled, so a deliberate correction is not
   * undone by dragging the pin.
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
    if (description.trim().length < 20)
      next.description = t("validation.descriptionMin");
    if (!price || Number(price) <= 0) next.price = t("validation.priceRequired");
    if (!area || Number(area) <= 0) next.area = t("validation.areaRequired");
    if (place.city.trim().length < 2) next.city = t("validation.cityRequired");
    if (place.district.trim().length < 2)
      next.district = t("validation.districtRequired");
    // One photo or one video is enough — the listing just needs something to show.
    if (media.length === 0) next.media = t("validation.mediaRequired");

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // 1. Create the property record.
      const createRes = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          type,
          price: Number(price),
          area: Number(area),
          ...roomCountsPayload(category, rooms),
          city: place.city.trim(),
          district: place.district.trim(),
          ...(place.region ? { region: place.region } : {}),
          ...(formattedAddress ? { formattedAddress } : {}),
          // Omitted entirely when no pin was dropped — the field is optional.
          ...(location
            ? { latitude: location.lat, longitude: location.lng }
            : {}),
          ...extraFieldsPayload(extra),
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        setSubmitError(createData.error ?? t("validation.generic"));
        return;
      }

      // 2. Upload the media. Photos and clips arrive through one picker but
      // are stored by two endpoints, so the mixed list is split here. Either
      // side may legitimately be empty — the form only requires one of them.
      setIsUploading(true);

      const { images, videos } = splitMedia(media);
      const propertyId = createData.property.id;

      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => formData.append("images", img.file));

        const uploadRes = await fetch(`/api/properties/${propertyId}/images`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json().catch(() => ({}));
          setSubmitError(uploadData.error ?? t("common.error"));
          return;
        }
      }

      if (videos.length > 0) {
        const videoData = new FormData();
        videos.forEach((video, index) => {
          videoData.append("videos", video.file);
          videoData.append(`duration-${index}`, String(video.durationSec));
          if (video.poster) {
            videoData.append(
              `poster-${index}`,
              video.poster,
              `poster-${index}.jpg`
            );
          }
        });

        const videoRes = await fetch(`/api/properties/${propertyId}/videos`, {
          method: "POST",
          body: videoData,
        });

        if (!videoRes.ok) {
          const videoError = await videoRes.json().catch(() => ({}));
          setSubmitError(videoError.error ?? t("common.error"));
          return;
        }
      }

      revokeMedia(media);
      setIsDone(true);
      router.refresh();
    } catch {
      setSubmitError(t("common.error"));
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  }

  const isBusy = isSubmitting || isUploading;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Basic info */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("newProperty.basicInfo")}
        </h2>

        <div className="space-y-4">
          <FormField
            id="title"
            label={t("property.title")}
            error={errors.title}
          >
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("newProperty.titlePlaceholder")}
              className={FIELD_CLASS}
              maxLength={200}
              aria-invalid={Boolean(errors.title)}
            />
          </FormField>

          <FormField
            id="description"
            label={t("property.description")}
            error={errors.description}
          >
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("newProperty.descriptionPlaceholder")}
              rows={5}
              className={`${FIELD_CLASS} resize-y`}
              maxLength={5000}
              aria-invalid={Boolean(errors.description)}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="type" label={t("property.type")}>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={FIELD_CLASS}
              >
                {PROPERTY_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {t(`property.for${value === "RENT" ? "Rent" : "Sale"}`)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField id="category" label={t("property.category")}>
              <select
                id="category"
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
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("newProperty.detailsSection")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="price" label={t("property.price")} error={errors.price}>
            <input
              id="price"
              type="number"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              min={1}
              className={FIELD_CLASS}
              aria-invalid={Boolean(errors.price)}
            />
          </FormField>

          <FormField id="area" label={t("property.area")} error={errors.area}>
            <input
              id="area"
              type="number"
              inputMode="numeric"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="0"
              min={1}
              className={FIELD_CLASS}
              aria-invalid={Boolean(errors.area)}
            />
          </FormField>
        </div>

        {/* Room counts, shown only for the categories that have them */}
        <div className="mt-4">
          <RoomCountFields
            category={category}
            value={rooms}
            onChange={setRooms}
          />
        </div>
      </section>

      {/* Location */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("newProperty.locationSection")}
        </h2>

        <LocationSelects value={place} onChange={setPlace} errors={errors} />

        {/* Map pin — optional, but required for the listing to appear on /map */}
        <div className="mt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
            <span className="text-sm font-medium text-gray-700">
              {t("locationPicker.label")}
            </span>
            <span className="text-xs text-gray-500">
              {t("locationPicker.optional")}
            </span>
          </div>

          <LocationPicker
            value={location}
            onChange={setLocation}
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
            onResolveAddress={applyResolvedAddress}
          />
        </div>
      </section>

      <PropertyExtraFields value={extra} onChange={setExtra} errors={errors} />

      {/* Photos and videos — one picker for both */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("newProperty.mediaSection")}
        </h2>

        <MediaUploader
          media={media}
          onChange={(next) => {
            setMedia(next);
            setErrors((prev) => ({ ...prev, media: undefined }));
          }}
          disabled={isBusy}
        />

        {errors.media ? (
          <p className="flex items-center gap-1.5 mt-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            {errors.media}
          </p>
        ) : null}
      </section>

      {/* Submit */}
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
        disabled={isBusy}
        className="flex items-center justify-center gap-2 w-full px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[52px]"
      >
        {isBusy && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
        {isUploading
          ? t("media.uploading")
          : isSubmitting
            ? t("newProperty.submitting")
            : t("newProperty.submit")}
      </button>
    </form>
  );
}
