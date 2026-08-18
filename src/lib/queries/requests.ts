import { prisma } from "@/lib/prisma";
import { parseCategoryParam } from "@/lib/property-categories";

export const REQUESTS_PAGE_SIZE = 12;

export interface RequestQuery {
  category?: string;
  region?: string;
  city?: string;
  district?: string;
  cursor?: string;
  limit?: number;
}

/** Normalise raw search params; unknown values degrade to "no filter". */
export function parseRequestQuery(
  params: Record<string, string | string[] | undefined>
): RequestQuery {
  const single = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const category = single("category");

  return {
    category: parseCategoryParam(category),
    region: single("region") || undefined,
    city: single("city") || undefined,
    district: single("district") || undefined,
    cursor: single("cursor") || undefined,
  };
}

/** Fetch one page of approved property requests. */
export async function getPropertyRequests(query: RequestQuery) {
  const limit = Math.min(Math.max(query.limit ?? REQUESTS_PAGE_SIZE, 1), 50);

  const where: Record<string, unknown> = { status: "APPROVED" };
  if (query.category) where.category = query.category;
  if (query.region) where.region = query.region;
  if (query.city) where.city = query.city;
  if (query.district) where.district = query.district;

  const rows = await prisma.propertyRequest.findMany({
    where,
    take: limit + 1,
    ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, phone: true } } },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

export type PropertyRequestListItem = Awaited<
  ReturnType<typeof getPropertyRequests>
>["items"][number];
