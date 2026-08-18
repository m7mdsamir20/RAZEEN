"use client";

import { useTranslations } from "next-intl";
import { FormField, FIELD_CLASS } from "@/components/ui/FormField";
import { fieldsFor, hasAnyRoomFields } from "@/lib/property-categories";

export interface RoomCounts {
  bedrooms: string;
  livingRooms: string;
  halls: string;
  bathrooms: string;
}

export const EMPTY_ROOM_COUNTS: RoomCounts = {
  bedrooms: "0",
  livingRooms: "0",
  halls: "0",
  bathrooms: "0",
};

interface Props {
  category: string;
  value: RoomCounts;
  onChange: (next: RoomCounts) => void;
  idPrefix?: string;
}

/**
 * Bedrooms / living rooms / halls / bathrooms, shown only where the category
 * calls for them — a plot of land is asked for none of these, an office only
 * for bathrooms. Renders nothing at all when none apply, so the form does not
 * leave an empty section behind.
 */
export function RoomCountFields({
  category,
  value,
  onChange,
  idPrefix = "",
}: Props) {
  const t = useTranslations();
  const fields = fieldsFor(category);

  if (!hasAnyRoomFields(category)) return null;

  const set = (key: keyof RoomCounts, next: string) =>
    onChange({ ...value, [key]: next });

  const inputs = [
    { key: "bedrooms" as const, show: fields.bedrooms, label: t("property.bedrooms") },
    { key: "livingRooms" as const, show: fields.livingRooms, label: t("property.livingRooms") },
    { key: "halls" as const, show: fields.halls, label: t("property.halls") },
    { key: "bathrooms" as const, show: fields.bathrooms, label: t("property.bathrooms") },
  ].filter((field) => field.show);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {inputs.map(({ key, label }) => (
        <FormField key={key} id={`${idPrefix}${key}`} label={label}>
          <input
            id={`${idPrefix}${key}`}
            type="number"
            inputMode="numeric"
            min={0}
            max={50}
            value={value[key]}
            onChange={(e) => set(key, e.target.value)}
            className={FIELD_CLASS}
          />
        </FormField>
      ))}
    </div>
  );
}

/** Turn the form's strings into numbers, zeroing anything the category hides. */
export function roomCountsPayload(category: string, value: RoomCounts) {
  const fields = fieldsFor(category);
  const toNumber = (raw: string) => {
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
  };

  return {
    bedrooms: fields.bedrooms ? toNumber(value.bedrooms) : 0,
    livingRooms: fields.livingRooms ? toNumber(value.livingRooms) : 0,
    halls: fields.halls ? toNumber(value.halls) : 0,
    bathrooms: fields.bathrooms ? toNumber(value.bathrooms) : 0,
  };
}

/** Populate the form from a stored row. */
export function roomCountsFrom(row: {
  bedrooms?: number | null;
  livingRooms?: number | null;
  halls?: number | null;
  bathrooms?: number | null;
}): RoomCounts {
  return {
    bedrooms: String(row.bedrooms ?? 0),
    livingRooms: String(row.livingRooms ?? 0),
    halls: String(row.halls ?? 0),
    bathrooms: String(row.bathrooms ?? 0),
  };
}
