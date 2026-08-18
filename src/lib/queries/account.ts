import { prisma } from "@/lib/prisma";

/** Listings owned by a user, newest first, including their status. */
export async function getUserListings(userId: string) {
  return prisma.property.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      user: { select: { name: true, phone: true } },
    },
  });
}

/** Property requests submitted by a user. */
export async function getUserRequests(userId: string) {
  return prisma.propertyRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, phone: true } } },
  });
}

/** Favourited properties, skipping any that are no longer approved. */
export async function getUserFavorites(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId, property: { status: "APPROVED" } },
    orderBy: { createdAt: "desc" },
    include: {
      property: {
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
      },
    },
  });

  return favorites.map((favorite) => favorite.property);
}

/**
 * Ids of everything a user has favourited, for rendering toggle state.
 * Returns null for signed-out visitors, who get no toggle at all.
 */
export async function getFavoriteIds(
  userId: string | undefined
): Promise<string[] | null> {
  if (!userId) return null;

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { propertyId: true },
  });

  return favorites.map((favorite) => favorite.propertyId);
}

/** Profile plus the counts shown on the account page. */
export async function getAccountOverview(userId: string) {
  const [user, listings, requests, favorites] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        isNafathVerified: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.property.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.propertyRequest.count({ where: { userId } }),
    prisma.favorite.count({ where: { userId } }),
  ]);

  const listingCounts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const row of listings) {
    if (row.status in listingCounts) {
      listingCounts[row.status as keyof typeof listingCounts] = row._count._all;
    }
  }

  return {
    user,
    listingCounts,
    totalListings:
      listingCounts.PENDING + listingCounts.APPROVED + listingCounts.REJECTED,
    requestCount: requests,
    favoriteCount: favorites,
  };
}

export type UserListing = Awaited<ReturnType<typeof getUserListings>>[number];
