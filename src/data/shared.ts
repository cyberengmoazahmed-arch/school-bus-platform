import "server-only";
import { prisma } from "@/lib/db";
import { GPS_STALE_MS } from "@/lib/enums";

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export type LiveVehicle = {
  tripId: string;
  busId: string;
  busCode: string;
  plateNumber: string;
  driverName: string;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  recordedAt: Date;
  stale: boolean;
};

/** Latest GPS fix for each of the given trips. */
export async function getLatestLocations(tripIds: string[]): Promise<Map<string, LiveVehicle>> {
  const result = new Map<string, LiveVehicle>();
  if (tripIds.length === 0) return result;

  const trips = await prisma.trip.findMany({
    where: { id: { in: tripIds } },
    include: {
      bus: true,
      driver: { include: { user: { select: { fullName: true } } } },
      gpsUpdates: { orderBy: { recordedAt: "desc" }, take: 1 },
    },
  });

  for (const trip of trips) {
    const fix = trip.gpsUpdates[0];
    if (!fix) continue;
    result.set(trip.id, {
      tripId: trip.id,
      busId: trip.busId,
      busCode: trip.bus.code,
      plateNumber: trip.bus.plateNumber,
      driverName: trip.driver.user.fullName,
      lat: fix.lat,
      lng: fix.lng,
      speed: fix.speed,
      heading: fix.heading,
      recordedAt: fix.recordedAt,
      stale: Date.now() - fix.recordedAt.getTime() > GPS_STALE_MS,
    });
  }
  return result;
}

export function isStale(recordedAt: Date | string): boolean {
  const t = typeof recordedAt === "string" ? new Date(recordedAt) : recordedAt;
  return Date.now() - t.getTime() > GPS_STALE_MS;
}
