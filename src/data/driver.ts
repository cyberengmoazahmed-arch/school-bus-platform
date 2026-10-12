import "server-only";
import { prisma } from "@/lib/db";
import { endOfToday, getLatestLocations, startOfToday } from "./shared";

export async function getDriverForUser(userId: string) {
  return prisma.driver.findUnique({
    where: { userId },
    include: { bus: true, school: true, user: true },
  });
}

export async function getDriverTripsToday(driverId: string) {
  return prisma.trip.findMany({
    where: { driverId, tripDate: { gte: startOfToday(), lte: endOfToday() } },
    include: {
      route: { include: { stops: { orderBy: { sequence: "asc" } } } },
      bus: true,
      school: true,
      gpsUpdates: { orderBy: { recordedAt: "desc" }, take: 1 },
      studentAssignments: { include: { student: { include: { homeAddress: true, guardians: { include: { user: { select: { fullName: true, phone: true } } } } } } } },
    },
    orderBy: { tripDate: "asc" },
  });
}

/** Full manifest for one trip, scoped to the owning driver. */
export async function getDriverTrip(driverId: string, tripId: string) {
  return prisma.trip.findFirst({
    where: { id: tripId, driverId },
    include: {
      route: { include: { stops: { orderBy: { sequence: "asc" } } } },
      bus: true,
      school: true,
      gpsUpdates: { orderBy: { recordedAt: "desc" }, take: 1 },
      studentAssignments: {
        include: {
          student: {
            include: {
              homeAddress: true,
              pickupPersons: { where: { isActive: true } },
              emergencyContacts: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getDriverUpcoming(driverId: string) {
  return prisma.trip.findMany({
    where: { driverId, tripDate: { gt: endOfToday() } },
    include: { route: true, bus: true, school: true },
    orderBy: { tripDate: "asc" },
    take: 10,
  });
}

export async function getDriverTripHistory(driverId: string) {
  return prisma.trip.findMany({
    where: { driverId, status: { in: ["COMPLETED", "ABORTED"] } },
    include: { route: true, bus: true, school: true },
    orderBy: { tripDate: "desc" },
    take: 20,
  });
}

export async function getDriverLiveLocation(tripId: string) {
  const map = await getLatestLocations([tripId]);
  return map.get(tripId) ?? null;
}
