import { requireUser } from "@/data/auth";
import { getDriverForUser, getDriverTripsToday } from "@/data/driver";
import { getT } from "@/lib/i18n";
import { DriverToday, type DriverTripView } from "./driver-today";

export default async function DriverPage() {
  const user = await requireUser();
  const [{ locale }, driver] = await Promise.all([getT(), getDriverForUser(user.id)]);

  if (!driver) {
    return (
      <div className="rounded-card border border-border bg-card p-6 text-sm text-muted-foreground">
        No driver profile linked to this account.
      </div>
    );
  }

  const trips = await getDriverTripsToday(driver.id);
  const driverName = user.fullName;

  const tripsView: DriverTripView[] = trips.map((t) => ({
    id: t.id,
    direction: t.direction,
    status: t.status,
    tripDate: t.tripDate.toISOString(),
    startedAt: t.startedAt?.toISOString() ?? null,
    endedAt: t.endedAt?.toISOString() ?? null,
    reconciliationComplete: t.reconciliationComplete,
    routeName: t.route.name,
    busCode: t.bus.code,
    plateNumber: t.bus.plateNumber,
    schoolName: t.school.name,
    stops: t.route.stops.map((s) => ({
      id: s.id,
      label: s.addressLabel,
      lat: s.lat,
      lng: s.lng,
      sequence: s.sequence,
    })),
    assignments: t.studentAssignments.map((a) => ({
      id: a.id,
      studentId: a.studentId,
      name: `${a.student.firstName} ${a.student.lastName}`,
      grade: a.student.grade,
      phone: a.student.guardians[0]?.user.phone ?? null,
      status: a.status,
      boardedAt: a.boardedAt?.toISOString() ?? null,
      droppedAt: a.droppedAt?.toISOString() ?? null,
      homeLat: a.student.homeAddress?.lat ?? null,
      homeLng: a.student.homeAddress?.lng ?? null,
    })),
    gps: t.gpsUpdates[0]
      ? { lat: t.gpsUpdates[0].lat, lng: t.gpsUpdates[0].lng, speed: t.gpsUpdates[0].speed, recordedAt: t.gpsUpdates[0].recordedAt.toISOString() }
      : null,
  }));

  return <DriverToday locale={locale} driverName={driverName} trips={tripsView} />;
}