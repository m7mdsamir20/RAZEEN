import { prisma } from "@/lib/prisma";
import { PROPERTY_TYPES } from "@/types";
import { parseCategoryParam } from "@/lib/property-categories";

export interface MapQuery {
  category?: string;
  type?: string;
  region?: string;
  city?: string;
  district?: string;
}

/** Normalise raw search params; unknown values degrade to "no filter". */
export function parseMapQuery(
  params: Record<string, string | string[] | undefined>
): MapQuery {
  const single = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const category = single("category");
  const type = single("type");

  return {
    category: parseCategoryParam(category),
    type: PROPERTY_TYPES.includes(type as (typeof PROPERTY_TYPES)[number])
      ? type
      : undefined,
    region: single("region") || undefined,
    city: single("city") || undefined,
    district: single("district") || undefined,
  };
}

/**
 * Approved properties that can actually be placed on the map.
 *
 * Selects only the fields a marker and its popup need — the map ships every
 * result to the client at once, so the payload stays deliberately small.
 */
export async function getMapProperties(query: MapQuery) {
  const where: Record<string, unknown> = {
    status: "APPROVED",
    dealStatus: null,
    latitude: { not: null },
    longitude: { not: null },
  };

  if (query.category) where.category = query.category;
  if (query.type) where.type = query.type;
  if (query.region) where.region = query.region;
  if (query.city) where.city = query.city;
  if (query.district) where.district = query.district;

  const rows = await prisma.property.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      type: true,
      price: true,
      area: true,
      bedrooms: true,
      bathrooms: true,
      city: true,
      district: true,
      latitude: true,
      longitude: true,
      publisherType: true,
      dealStatus: true,
      discountPercent: true,
      ageYears: true,
      facade: true,
      images: {
        orderBy: { order: "asc" },
        take: 1,
        select: { thumbnailUrl: true },
      },
    },
  });

  // The null check above is a runtime filter Prisma cannot narrow types with.
  return rows.filter(
    (row): row is typeof row & { latitude: number; longitude: number } =>
      row.latitude !== null && row.longitude !== null
  );
}

export type MapProperty = Awaited<ReturnType<typeof getMapProperties>>[number];
