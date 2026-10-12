import "server-only";
import { prisma } from "@/lib/db";
import { endOfToday, getLatestLocations, startOfToday, type LiveVehicle } from "./shared";

export async function getPlatformStats() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    parents,
    students,
    schools,
    drivers,
    buses,
    activeSubscriptions,
    activePlans,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "PARENT" } }),
    prisma.student.count({ where: { isActive: true } }),
    prisma.school.count({ where: { isActive: true } }),
    prisma.driver.count(),
    prisma.bus.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.findMany({ where: { status: "ACTIVE" }, select: { priceEGP: true, discountEGP: true } }),
  ]);

  const mrr = activePlans.reduce((sum, s) => sum + (s.priceEGP - s.discountEGP), 0);

  const [collectedThisMonth, failedPayments, refunds, openIncidents, openTickets] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amountEGP: true }, where: { status: "SUCCEEDED", paidAt: { gte: monthStart } } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.refund.aggregate({ _sum: { amountEGP: true }, where: { status: "PROCESSED" } }),
    prisma.safetyIncident.count({ where: { status: { in: ["OPEN", "ACKNOWLEDGED"] } } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } } }),
  ]);

  const activeTrips = await prisma.trip.findMany({ where: { status: "IN_PROGRESS" }, select: { id: true } });
  const locations = await getLatestLocations(activeTrips.map((t) => t.id));

  return {
    counts: { parents, students, schools, drivers, buses, activeSubscriptions },
    revenue: {
      mrr,
      arr: mrr * 12,
      collectedThisMonth: collectedThisMonth._sum.amountEGP ?? 0,
      refunded: refunds._sum.amountEGP ?? 0,
      failedPayments,
    },
    operations: {
      activeTrips: activeTrips.length,
      openIncidents,
      openTickets,
    },
    live: [...locations.values()] as LiveVehicle[],
  };
}

export async function getFleet() {
  return prisma.bus.findMany({
    include: {
      vehicles: true,
      drivers: { include: { user: { select: { fullName: true } } } },
      _count: { select: { trips: true } },
    },
    orderBy: { code: "asc" },
  });
}

export async function getDriversAdmin() {
  return prisma.driver.findMany({
    include: { user: true, bus: true, school: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSchoolsAdmin() {
  return prisma.school.findMany({
    include: {
      _count: { select: { students: true, drivers: true, routes: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getRoutesAdmin() {
  return prisma.route.findMany({
    include: {
      school: true,
      stops: { orderBy: { sequence: "asc" }, include: { student: true } },
      trips: { where: { tripDate: { gte: startOfToday() } }, orderBy: { tripDate: "asc" }, take: 3 },
    },
    orderBy: { name: "asc" },
  });
}

export async function getPlans() {
  return prisma.subscriptionPlan.findMany({ orderBy: { basePrice: "asc" } });
}

export async function getSubscriptionsAdmin() {
  return prisma.subscription.findMany({
    include: { plan: true, student: true, parent: { select: { fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getIncidentsAdmin() {
  return prisma.safetyIncident.findMany({
    include: {
      trip: { include: { bus: true } },
      school: true,
      student: true,
      reportedBy: { select: { fullName: true, role: true } },
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
}

export async function getTicketsAdmin() {
  return prisma.supportTicket.findMany({
    include: {
      requester: { select: { fullName: true, email: true, role: true } },
      assignee: { select: { fullName: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getAuditLogs(take = 100) {
  return prisma.auditLog.findMany({
    include: { actor: { select: { fullName: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getDailyRevenue(days = 14) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const payments = await prisma.payment.findMany({
    where: { status: "SUCCEEDED", paidAt: { gte: from } },
    select: { amountEGP: true, paidAt: true },
  });
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const p of payments) {
    if (!p.paidAt) continue;
    const key = p.paidAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + p.amountEGP);
  }
  return [...buckets.entries()]
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
