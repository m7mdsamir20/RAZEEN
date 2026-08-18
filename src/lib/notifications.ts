import { prisma } from "@/lib/prisma";

/**
 * In-app notifications.
 *
 * A notification stores a translation key and its parameters, never finished
 * text — the same row has to read correctly in Arabic and in English, and the
 * reader's locale is only known at render time.
 */

export const NOTIFICATION_TYPES = [
  // To the publisher, about their own submission
  "PROPERTY_APPROVED",
  "PROPERTY_REJECTED",
  "REQUEST_APPROVED",
  "REQUEST_REJECTED",
  // To the company admins, about incoming work
  "NEW_PROPERTY",
  "NEW_REQUEST",
  "NEW_MANAGEMENT",
  "NEW_MARKETING",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

interface NotifyInput {
  userId: string;
  type: NotificationType;
  /** Values interpolated into the message, e.g. the listing title. */
  params?: Record<string, string>;
  /** Where the notification leads, without the locale prefix. */
  link?: string;
}

/**
 * Record a notification. Never throws: a notification failing must not take
 * down the action that triggered it (approving a listing, submitting a form).
 */
export async function notify({ userId, type, params, link }: NotifyInput) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        titleKey: `notifications.${type}.title`,
        bodyKey: `notifications.${type}.body`,
        params: params ? JSON.stringify(params) : null,
        link: link ?? null,
      },
    });
  } catch (error) {
    console.error("notify failed:", error);
  }
}

/** Same, but to every company admin — used for incoming submissions. */
export async function notifyAdmins(
  input: Omit<NotifyInput, "userId">
): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "COMPANY_ADMIN" },
      select: { id: true },
    });

    if (admins.length === 0) return;

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: input.type,
        titleKey: `notifications.${input.type}.title`,
        bodyKey: `notifications.${input.type}.body`,
        params: input.params ? JSON.stringify(input.params) : null,
        link: input.link ?? null,
      })),
    });
  } catch (error) {
    console.error("notifyAdmins failed:", error);
  }
}

/** How many rows a single fetch returns — the panel is a recent list, not an archive. */
export const NOTIFICATIONS_LIMIT = 20;

/** The reader's recent notifications, plus how many are still unread. */
export async function getNotifications(userId: string) {
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: NOTIFICATIONS_LIMIT,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      titleKey: item.titleKey,
      bodyKey: item.bodyKey,
      params: parseParams(item.params),
      link: item.link,
      isRead: item.isRead,
      createdAt: item.createdAt.toISOString(),
    })),
    unreadCount,
  };
}

export type NotificationItem = Awaited<
  ReturnType<typeof getNotifications>
>["items"][number];

/** Stored params are JSON written by this module; a bad row must not crash the panel. */
function parseParams(raw: string | null): Record<string, string> {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
