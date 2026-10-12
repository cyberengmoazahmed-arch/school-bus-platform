import "server-only";
import { prisma } from "@/lib/db";

export async function getTicketsForSupport(userId: string, role: string) {
  const isStaff = role === "SUPER_ADMIN" || role === "SUPPORT";
  const include = {
    requester: { select: { fullName: true, email: true, role: true } },
    assignee: { select: { fullName: true } },
    messages: { orderBy: { createdAt: "asc" as const }, include: { author: { select: { fullName: true, role: true } } } },
  };
  if (isStaff) {
    return prisma.supportTicket.findMany({
      include,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    });
  }
  return prisma.supportTicket.findMany({
    where: { requesterId: userId },
    include,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
