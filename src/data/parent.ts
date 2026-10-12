import "server-only";
import { prisma } from "@/lib/db";
import { endOfToday, getLatestLocations, startOfToday, type LiveVehicle } from "./shared";
import { etaMinutes, haversineKm } from "@/lib/geo";

export async function getChildrenForParent(parentId: string) {
  return prisma.student.findMany({
    where: { guardians: { some: { userId: parentId } }, isActive: true },
    include: { school: true, homeAddress: true },
    orderBy: [{ firstName: "asc" }],
  });
}

/** Returns the student only if the given user is an authorized guardian. */
export async function getStudentForGuardian(parentId: string, studentId: string) {
  return prisma.student.findFirst({
    where: { id: studentId, guardians: { some: { userId: parentId } } },
    include: {
      school: true,
      homeAddress: true,
      guardians: {
        include: { user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } } },
      },
      emergencyContacts: { orderBy: { isPrimary: "desc" } },
      pickupPersons: { orderBy: { createdAt: "asc" } },
      enrollments: true,
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export type ChildLiveStatus = {
  studentId: string;
  studentName: string;
  photoUrl: string | null;
  grade: string;
  schoolName: string;
  tripId: string | null;
  tripStatus: string | null;
  direction: string | null;
  busCode: string | null;
  plateNumber: string | null;
  driverName: string | null;
  assignmentStatus: string | null;
  etaMinutes: number | null;
  distanceKm: number | null;
  live: LiveVehicle | null;
  subscriptionStatus: string | null;
  subscriptionRenewsAt: Date | null;
};

/** Aggregated data for the parent dashboard cards. */
export async function getParentDashboard(parentId: string): Promise<ChildLiveStatus[]> {
  const children = await getChildrenForParent(parentId);
  if (children.length === 0) return [];

  const now = new Date();
  const assignments = await prisma.studentTripAssignment.findMany({
    where: { studentId: { in: children.map((c) => c.id) }, trip: { tripDate: { gte: startOfToday(), lte: endOfToday() } } },
    include: {
      trip: { include: { bus: true, route: true, driver: { include: { user: { select: { fullName: true } } } } } },
    },
    orderBy: { trip: { tripDate: "asc" } },
  });

  const subscriptions = await prisma.subscription.findMany({
    where: { studentId: { in: children.map((c) => c.id) } },
    orderBy: { createdAt: "desc" },
  });

  const activeOrUpcoming = assignments.filter((a) => ["IN_PROGRESS", "SCHEDULED"].includes(a.trip.status));
  const tripIds = activeOrUpcoming.map((a) => a.tripId);
  const locations = await getLatestLocations(tripIds);

  return children.map((child) => {
    const relevant =
      activeOrUpcoming.find((a) => a.studentId === child.id && a.trip.status === "IN_PROGRESS") ??
      activeOrUpcoming.find((a) => a.studentId === child.id) ??
      null;

    const sub = subscriptions.find((s) => s.studentId === child.id) ?? null;
    const live = relevant ? locations.get(relevant.tripId) ?? null : null;

    let eta: number | null = null;
    let distance: number | null = null;
    if (live && child.homeAddress) {
      distance = haversineKm({ lat: live.lat, lng: live.lng }, { lat: child.homeAddress.lat, lng: child.homeAddress.lng });
      eta = Math.round(etaMinutes(distance));
    }

    return {
      studentId: child.id,
      studentName: `${child.firstName} ${child.lastName}`,
      photoUrl: child.photoUrl,
      grade: child.grade,
      schoolName: child.school.name,
      tripId: relevant?.tripId ?? null,
      tripStatus: relevant?.trip.status ?? null,
      direction: relevant?.trip.direction ?? null,
      busCode: relevant?.trip.bus.code ?? null,
      plateNumber: relevant?.trip.bus.plateNumber ?? null,
      driverName: relevant?.trip.driver.user.fullName ?? null,
      assignmentStatus: relevant?.status ?? null,
      etaMinutes: eta,
      distanceKm: distance,
      live,
      subscriptionStatus: sub?.status ?? null,
      subscriptionRenewsAt: sub?.endDate ?? null,
    };
  });
}

export async function getSubscriptionsForParent(parentId: string) {
  return prisma.subscription.findMany({
    where: { parentId },
    include: { plan: true, student: true, invoices: { orderBy: { issuedAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getParentInvoices(parentId: string) {
  return prisma.invoice.findMany({
    where: { parentId },
    include: { subscription: { include: { student: true } } },
    orderBy: { issuedAt: "desc" },
    take: 50,
  });
}

export async function getParentPayments(parentId: string) {
  return prisma.payment.findMany({
    where: { parentId },
    include: { refunds: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getParentTickets(parentId: string) {
  return prisma.supportTicket.findMany({
    where: { requesterId: parentId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { fullName: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getChildTripHistory(parentId: string, studentId: string, take = 30) {
  const student = await getStudentForGuardian(parentId, studentId);
  if (!student) return null;
  return prisma.studentTripAssignment.findMany({
    where: { studentId },
    include: {
      trip: {
        include: {
          bus: true,
          route: true,
          driver: { include: { user: { select: { fullName: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
