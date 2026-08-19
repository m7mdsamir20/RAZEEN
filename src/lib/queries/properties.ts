import { prisma } from "@/lib/prisma";
import { PROPERTY_TYPES } from "@/types";
import { parseCategoryParam } from "@/lib/property-categories";

export const PAGE_SIZE = 12;

export interface PropertyQuery {
  /** Free-text search across the title, description and location. */
  q?: string;
  category?: string;
  type?: string;
  region?: string;
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  cursor?: string;
  limit?: number;
}

/**
 * Normalise raw search params into a validated query. Unknown values are
 * dropped rather than rejected so a hand-edited URL degrades to "no filter".
 */
export function parsePropertyQuery(
  params: Record<string, string | string[] | undefined>
): PropertyQuery {
  const single = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const positiveNumber = (key: string) => {
    const raw = single(key);
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  };

  const category = single("category");
  const type = single("type");

  // Trimmed and capped: a very long term is a mistake or an attack, and
  // either way it cannot match anything useful.
  const q = single("q")?.trim().slice(0, 100) || undefined;

  return {
    q,
    category: parseCategoryParam(category),
    type: PROPERTY_TYPES.includes(type as (typeof PROPERTY_TYPES)[number])
      ? type
      : undefined,
    region: single("region") || undefined,
    city: single("city") || undefined,
    district: single("district") || undefined,
    minPrice: positiveNumber("minPrice"),
    maxPrice: positiveNumber("maxPrice"),
    bedrooms: positiveNumber("bedrooms"),
    cursor: single("cursor") || undefined,
  };
}

/**
 * Fetch one page of approved properties. Returns `limit` items plus the
 * cursor for the next page (null when the last page has been reached).
 */
export async function getProperties(query: PropertyQuery) {
  const limit = Math.min(Math.max(query.limit ?? PAGE_SIZE, 1), 50);

  // A closed deal stays approved but is no longer on the market.
  const where: Record<string, unknown> = {
    status: "APPROVED",
    dealStatus: null,
  };

  // Matches any of the fields a person would think to type into a search box.
  // MySQL's default collation is case-insensitive, so `contains` is enough.
  if (query.q) {
    where.OR = [
      { title: { contains: query.q } },
      { description: { contains: query.q } },
      { city: { contains: query.q } },
      { district: { contains: query.q } },
    ];
  }

  if (query.category) where.category = query.category;
  if (query.type) where.type = query.type;
  if (query.region) where.region = query.region;
  if (query.city) where.city = query.city;
  if (query.district) where.district = query.district;
  if (query.bedrooms !== undefined) where.bedrooms = { gte: query.bedrooms };

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const price: Record<string, number> = {};
    if (query.minPrice !== undefined) price.gte = query.minPrice;
    if (query.maxPrice !== undefined) price.lte = query.maxPrice;
    where.price = price;
  }

  const rows = await prisma.property.findMany({
    where,
    take: limit + 1, // one extra row tells us whether another page exists
    ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      // Fallback thumbnail for listings published with video only.
      videos: {
        orderBy: { order: "asc" },
        take: 1,
        select: { thumbnailUrl: true },
      },
      user: { select: { name: true, phone: true } },
    },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

export type PropertyListItem = Awaited<
  ReturnType<typeof getProperties>
>["items"][number];

/**
 * Listings comparable to `property`, best match first.
 *
 * Tries progressively looser rules — same district, then same city, then same
 * region — and stops as soon as enough are found, so a listing in a quiet area
 * still gets suggestions instead of an empty row.
 */
export async function getSimilarProperties(
  property: {
    id: string;
    category: string;
    type: string;
    region: string | null;
    city: string;
    district: string;
    price: number;
  },
  limit = 3
) {
  const base = {
    status: "APPROVED",
    dealStatus: null,
    id: { not: property.id },
    type: property.type,
  };

  const include = {
    images: { orderBy: { order: "asc" as const }, take: 1 },
    videos: {
      orderBy: { order: "asc" as const },
      take: 1,
      select: { thumbnailUrl: true },
    },
    user: { select: { name: true, phone: true } },
  };

  // Within ±35% of the price, so "similar" stays similar in budget too.
  const priceBand = {
    gte: property.price * 0.65,
    lte: property.price * 1.35,
  };

  const tiers = [
    { ...base, category: property.category, district: property.district, price: priceBand },
    { ...base, category: property.category, city: property.city },
    ...(property.region
      ? [{ ...base, category: property.category, region: property.region }]
      : []),
    { ...base, city: property.city },
  ];

  const found = new Map<string, Awaited<ReturnType<typeof getProperties>>["items"][number]>();

  for (const where of tiers) {
    if (found.size >= limit) break;

    const rows = await prisma.property.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      take: limit * 2,
    });

    for (const row of rows) {
      if (found.size >= limit) break;
      if (!found.has(row.id)) found.set(row.id, row);
    }
  }

  return [...found.values()];
}
