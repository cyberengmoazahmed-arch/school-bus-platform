"use server";

import { revalidatePath } from "next/cache";
import { requireRoleOrThrow } from "@/data/auth";
import { prisma } from "@/lib/db";
import { dispatchNotification, notifyStudentGuardians } from "@/lib/notifications";
import { recordAudit } from "@/lib/audit";
import { APPROACH_RADIUS_KM } from "@/lib/enums";
import { etaMinutes, haversineKm } from "@/lib/geo";

export type TripActionResult = { ok: boolean; error?: string; unaccounted?: number };

async function driverForCurrentUser() {
  const user = await requireRoleOrThrow(["DRIVER"]);
  const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
  if (!driver) throw new Error("NO_DRIVER_PROFILE");
  return { user, driver };
}

async function ownedTrip(driverId: string, tripId: string) {
  const trip = await prisma.trip.findFirst({ where: { id: tripId, driverId }, include: { studentAssignments: true } });
  if (!trip) throw new Error("TRIP_NOT_FOUND");
  return trip;
}

export async function startTripAction(tripId: string): Promise<TripActionResult> {
  const { user, driver } = await driverForCurrentUser();
  const trip = await ownedTrip(driver.id, tripId);
  if (trip.status !== "SCHEDULED") return { ok: false, error: "TRIP_NOT_SCHEDULED" };

  await prisma.trip.update({ where: { id: trip.id }, data: { status: "IN_PROGRESS", startedAt: new Date() } });
  await recordAudit({ actorId: user.id, action: "TRIP_START", entity: "Trip", entityId: trip.id });

  // Let guardians know the bus is picking-up.
  for (const a of trip.studentAssignments) {
    await notifyStudentGuardians(a.studentId, {
      type: "TRIP_STARTED",
      title: "The bus is on its way",
      body: "The bus has started its route. Stay tuned for arrival updates.",
      severity: "INFO",
    });
  }

  revalidatePath("/driver");
  return { ok: true };
}

export async function endTripAction(tripId: string): Promise<TripActionResult> {
  const { user, driver } = await driverForCurrentUser();
  const trip = await ownedTrip(driver.id, tripId);
  if (trip.status !== "IN_PROGRESS") return { ok: false, error: "TRIP_NOT_IN_PROGRESS" };

  const unaccounted = trip.studentAssignments.filter(
    (a) => ["EXPECTED", "UNACCOUNTED"].includes(a.status),
  ).length;

  // Safety net: never let the driver close a trip with kids unaccounted for.
  if (unaccounted > 0) return { ok: false, error: "UNACCOUNTED_STUDENTS", unaccounted };

  await prisma.trip.update({
    where: { id: trip.id },
    data: { status: "COMPLETED", endedAt: new Date(), reconciliationComplete: true },
  });
  await prisma.driver.update({ where: { id: driver.id }, data: { totalTrips: { increment: 1 } } });
  await recordAudit({ actorId: user.id, action: "TRIP_COMPLETE", entity: "Trip", entityId: trip.id });

  for (const a of trip.studentAssignments) {
    if (a.status === "ONBOARD") {
      await notifyStudentGuardians(a.studentId, {
        type: "TRIP_ENDED",
        title: "Trip complete",
        body: "This route has finished. All children accounted for.",
        severity: "SUCCESS",
      });
    }
  }

  revalidatePath("/driver");
  return { ok: true };
}

export async function markBoardedAction(tripId: string, assignmentId: string): Promise<TripActionResult> {
  const { user, driver } = await driverForCurrentUser();
  const trip = await ownedTrip(driver.id, tripId);
  const assignment = trip.studentAssignments.find((a) => a.id === assignmentId);
  if (!assignment) return { ok: false, error: "NOT_ON_MANIFEST" };

  await prisma.studentTripAssignment.update({
    where: { id: assignment.id },
    data: { status: "ONBOARD", boardedAt: new Date(), updatedAt: new Date() },
  });
  await prisma.boardingEvent.create({
    data: { tripId: trip.id, studentId: assignment.studentId, driverId: driver.id, method: "MANUAL" },
  });
  await notifyStudentGuardians(assignment.studentId, {
    type: "STUDENT_BOARDED",
    title: `${user.fullName.split(" ")[0]} is on the bus`,
    body: "Your child has boarded the school bus.",
    severity: "SUCCESS",
  });

  revalidatePath("/driver");
  return { ok: true };
}

export async function markDroppedAction(tripId: string, assignmentId: string): Promise<TripActionResult> {
  const { user, driver } = await driverForCurrentUser();
  const trip = await ownedTrip(driver.id, tripId);
  const assignment = trip.studentAssignments.find((a) => a.id === assignmentId);
  if (!assignment) return { ok: false, error: "NOT_ON_MANIFEST" };

  await prisma.studentTripAssignment.update({
    where: { id: assignment.id },
    data: { status: "DROPPED", droppedAt: new Date(), updatedAt: new Date() },
  });
  await prisma.dropoffEvent.create({
    data: { tripId: trip.id, studentId: assignment.studentId, driverId: driver.id, method: "MANUAL" },
  });
  await notifyStudentGuardians(assignment.studentId, {
    type: "DROPPED_HOME",
    title: "Arrived home safely",
    body: "Your child has been dropped off safely.",
    severity: "SUCCESS",
  });

  revalidatePath("/driver");
  return { ok: true };
}

export async function markAbsentAction(tripId: string, assignmentId: string): Promise<TripActionResult> {
  const { user, driver } = await driverForCurrentUser();
  const trip = await ownedTrip(driver.id, tripId);
  const assignment = trip.studentAssignments.find((a) => a.id === assignmentId);
  if (!assignment) return { ok: false, error: "NOT_ON_MANIFEST" };

  await prisma.studentTripAssignment.update({
    where: { id: assignment.id },
    data: { status: "ABSENT", updatedAt: new Date() },
  });
  await notifyStudentGuardians(assignment.studentId, {
    type: "ABSENT",
    title: "Marked absent",
    body: "Your child did not board the bus and was marked absent.",
    severity: "WARNING",
  });

  revalidatePath("/driver");
  return { ok: true };
}

/**
 * Ingests a GPS fix from the driver app. Also fires "bus approaching" alerts
 * when the bus enters the radius of a remaining stop (deduplicated).
 */
export async function gpsPingAction(
  tripId: string,
  input: { lat: number; lng: number; speed?: number | null; heading?: number | null },
): Promise<TripActionResult> {
  const { driver } = await driverForCurrentUser();
  const trip = await ownedTrip(driver.id, tripId);
  if (trip.status !== "IN_PROGRESS") return { ok: false, error: "TRIP_NOT_IN_PROGRESS" };

  await prisma.gpsLocationUpdate.create({
    data: {
      tripId: trip.id,
      busId: trip.busId,
      lat: input.lat,
      lng: input.lng,
      speed: input.speed ?? null,
      heading: input.heading ?? null,
      source: "DRIVER_APP",
    },
  });

  // Approach detection against remaining stops.
  const remaining = await prisma.studentTripAssignment.findMany({
    where: { tripId: trip.id, status: { in: ["EXPECTED"] } },
    include: { student: { include: { homeAddress: { select: { lat: true, lng: true } } } } },
  });

  for (const a of remaining) {
    const home = a.student.homeAddress;
    if (!home) continue;
    const distance = haversineKm({ lat: input.lat, lng: input.lng }, { lat: home.lat, lng: home.lng });
    if (distance <= APPROACH_RADIUS_KM) {
      const remains = remaining.length;
      const minutes = Math.max(1, Math.round(etaMinutes(distance)));
      const prefix = remains === 1 ? "The bus is almost there" : `The bus is arriving soon`;
      await notifyStudentGuardians(a.studentId, {
        type: remains > 1 ? "BUS_APPROACHING_10" : "BUS_APPROACHING_5",
        title: `${prefix} in ~${minutes} min`,
        body: `The bus is about ${minutes} minute(s) away. Please have your child ready.`,
        severity: "INFO",
        dedupeKey: `approach:${trip.id}:${a.studentId}`,
        dedupeWindowMs: 15 * 60 * 1000,
      });
    }
  }

  return { ok: true };
}

export async function reportIncidentAction(formData: FormData): Promise<TripActionResult> {
  const { user, driver } = await driverForCurrentUser();
  const type = String(formData.get("type") ?? "OTHER");
  const severity = String(formData.get("severity") ?? "MEDIUM");
  const description = String(formData.get("description") ?? "").trim();
  const tripId = String(formData.get("tripId") ?? "");

  if (description.length < 5) return { ok: false, error: "DESCRIPTION_REQUIRED" };

  const trip = tripId ? await ownedTrip(driver.id, tripId) : null;
  const incident = await prisma.safetyIncident.create({
    data: {
      tripId: trip?.id ?? null,
      schoolId: trip?.schoolId ?? driver.schoolId ?? null,
      reportedById: user.id,
      type,
      severity,
      description,
    },
  });
  await recordAudit({ actorId: user.id, action: "INCIDENT_REPORT", entity: "SafetyIncident", entityId: incident.id });

  // Alert the school admin + onboard students' guardians.
  if (trip?.schoolId) {
    const staff = await prisma.schoolStaff.findMany({ where: { schoolId: trip.schoolId }, select: { userId: true } });
    for (const s of staff) {
      await dispatchNotification({
        userId: s.userId,
        type: "INCIDENT",
        title: `Incident: ${type.replaceAll("_", " ")}`,
        body: description,
        severity: severity === "CRITICAL" || severity === "HIGH" ? "CRITICAL" : "WARNING",
      });
    }
    for (const a of trip.studentAssignments) {
      await notifyStudentGuardians(a.studentId, {
        type: "INCIDENT",
        title: `Bus incident: ${type.replaceAll("_", " ")}`,
        body: "Our team is aware and following-up. We will keep you posted.",
        severity: severity === "CRITICAL" || severity === "HIGH" ? "CRITICAL" : "WARNING",
      });
    }
  }

  revalidatePath("/driver");
  revalidatePath("/school/incidents");
  return { ok: true };
}