import { prisma } from "@/lib/prisma";
import {
  PROPERTY_STATUSES,
  MANAGEMENT_STATUSES,
  type PropertyStatus,
  type ManagementStatus,
} from "@/types";

/** Counts and recent activity for the admin overview. */
export async function getAdminOverview() {
  const [
    propertyCounts,
    requestCounts,
    managementCounts,
    marketingCounts,
    userCount,
    verifiedUserCount,
    unreadMessageCount,
    recentProperties,
  ] = await Promise.all([
    prisma.property.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.propertyRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.managementRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.marketingRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { isNafathVerified: true } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.property.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        city: true,
        district: true,
        price: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  const tally = <T extends string>(
    rows: { status: string; _count: { _all: number } }[],
    keys: readonly T[]
  ) => {
    const result = Object.fromEntries(keys.map((k) => [k, 0])) as Record<
      T,
      number
    >;
    for (const row of rows) {
      if ((keys as readonly string[]).includes(row.status)) {
        result[row.status as T] = row._count._all;
      }
    }
    return result;
  };

  return {
    properties: tally<PropertyStatus>(propertyCounts, PROPERTY_STATUSES),
    requests: tally<PropertyStatus>(requestCounts, PROPERTY_STATUSES),
    management: tally<ManagementStatus>(managementCounts, MANAGEMENT_STATUSES),
    marketing: tally<ManagementStatus>(marketingCounts, MANAGEMENT_STATUSES),
    userCount,
    verifiedUserCount,
    unreadMessageCount,
    recentProperties,
  };
}

/** Properties for the moderation queue, newest first, filtered by status. */
export async function getAdminProperties(status?: string) {
  const where =
    status && PROPERTY_STATUSES.includes(status as PropertyStatus)
      ? { status }
      : {};

  return prisma.property.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      user: { select: { name: true, phone: true, isNafathVerified: true } },
    },
  });
}

/** Property requests for the moderation queue. */
export async function getAdminRequests(status?: string) {
  const where =
    status && PROPERTY_STATUSES.includes(status as PropertyStatus)
      ? { status }
      : {};

  return prisma.propertyRequest.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, phone: true, isNafathVerified: true } },
    },
  });
}

/** Property-management enquiries, newest first. */
export async function getAdminManagementRequests(status?: string) {
  const where =
    status && MANAGEMENT_STATUSES.includes(status as ManagementStatus)
      ? { status }
      : {};

  return prisma.managementRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, phone: true } } },
  });
}

/** Property-marketing enquiries, newest first. */
export async function getAdminMarketingRequests(status?: string) {
  const where =
    status && MANAGEMENT_STATUSES.includes(status as ManagementStatus)
      ? { status }
      : {};

  return prisma.marketingRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, phone: true } } },
  });
}

export type AdminProperty = Awaited<
  ReturnType<typeof getAdminProperties>
>[number];
export type AdminRequest = Awaited<ReturnType<typeof getAdminRequests>>[number];
export type AdminManagementRequest = Awaited<
  ReturnType<typeof getAdminManagementRequests>
>[number];
export type AdminMarketingRequest = Awaited<
  ReturnType<typeof getAdminMarketingRequests>
>[number];
