import "server-only";
import { prisma } from "@/lib/db";

export async function getNotifications(userId: string, take = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    include: { logs: true },
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function getNotificationPreferences(userId: string) {
  const existing = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.notificationPreference.create({ data: { userId } });
}
