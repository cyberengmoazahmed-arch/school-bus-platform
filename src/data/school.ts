import "server-only";
import { prisma } from "@/lib/db";
import { endOfToday, getLatestLocations, startOfToday, type LiveVehicle } from "./shared";

export async function getSchoolForAdmin(userId: string) {
  const staff = await prisma.schoolStaff.findFirst({
    where: { userId, isActive: true },
    include: { school: true },
    orderBy: { createdAt: "asc" },
  });
  return staff?.school ?? null;
}

export async function getSchoolDashboard(schoolId: string) {
  const [students, buses, drivers, routes] = await Promise.all([
    prisma.student.count({ where: { schoolId, isActive: true } }),
    prisma.bus.count({ where: { status: "ACTIVE" } }),
    prisma.driver.count({ where: { schoolId, status: "VERIFIED" } }),
    prisma.route.count({ where: { schoolId, status: "ACTIVE" } }),
  ]);

  const todayTrips = await prisma.trip.findMany({
    where: { schoolId, tripDate: { gte: startOfToday(), lte: endOfToday() } },
    include: {
      route: true,
      bus: true,
      driver: { include: { user: { select: { fullName: true } } } },
      studentAssignments: true,
    },
    orderBy: { tripDate: "asc" },
  });

  const activeTripIds = todayTrips.filter((t) => t.status === "IN_PROGRESS").map((t) => t.id);
  const locations = await getLatestLocations(activeTripIds);
  const live: LiveVehicle[] = [...locations.values()];

  let onboard = 0;
  let dropped = 0;
  let missed = 0;
  let absent = 0;
  for (const t of todayTrips) {
    for (const a of t.studentAssignments) {
      if (a.status === "ONBOARD") onboard++;
      else if (a.status === "DROPPED") dropped++;
      else if (a.status === "MISSED") missed++;
      else if (a.status === "ABSENT") absent++;
    }
  }

  return {
    counts: { students, buses, drivers, routes },
    todayTrips,
    live,
    attendance: { onboard, dropped, missed, absent },
  };
}

export async function getSchoolStudents(schoolId: string) {
  return prisma.student.findMany({
    where: { schoolId, isActive: true },
    include: {
      homeAddress: true,
      guardians: { include: { user: { select: { fullName: true, phone: true } } } },
      subscriptions: { where: { status: "ACTIVE" }, include: { plan: true } },
    },
    orderBy: [{ grade: "asc" }, { firstName: "asc" }],
  });
}

export async function getSchoolRoutes(schoolId: string) {
  return prisma.route.findMany({
    where: { schoolId },
    include: {
      stops: { orderBy: { sequence: "asc" }, include: { student: true } },
      trips: { where: { tripDate: { gte: startOfToday() } }, orderBy: { tripDate: "asc" }, take: 5 },
    },
    orderBy: { name: "asc" },
  });
}

export async function getSchoolIncidents(schoolId: string) {
  return prisma.safetyIncident.findMany({
    where: { schoolId },
    include: {
      trip: { include: { bus: true } },
      reportedBy: { select: { fullName: true, role: true } },
      student: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/** Per-student attendance summary for reports. */
export async function getSchoolAttendance(schoolId: string, from: Date, to: Date) {
  const trips = await prisma.trip.findMany({
    where: { schoolId, tripDate: { gte: from, lte: to }, status: "COMPLETED" },
    include: { studentAssignments: { include: { student: true } } },
  });

  const map = new Map<string, { name: string; grade: string; boarded: number; dropped: number; absent: number; missed: number; total: number }>();
  for (const trip of trips) {
    for (const a of trip.studentAssignments) {
      const key = a.studentId;
      const entry = map.get(key) ?? { name: `${a.student.firstName} ${a.student.lastName}`, grade: a.student.grade, boarded: 0, dropped: 0, absent: 0, missed: 0, total: 0 };
      entry.total++;
      if (a.boardedAt || a.status === "ONBOARD" || a.status === "DROPPED") entry.boarded++;
      if (a.status === "DROPPED") entry.dropped++;
      if (a.status === "ABSENT") entry.absent++;
      if (a.status === "MISSED") entry.missed++;
      map.set(key, entry);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
