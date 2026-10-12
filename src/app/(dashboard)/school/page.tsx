import { requireUser } from "@/data/auth";
import { getSchoolForAdmin, getSchoolDashboard } from "@/data/school";
import { getT } from "@/lib/i18n";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard, SectionHeader } from "@/components/ui/misc";
import { LiveMap } from "@/components/maps/live-map";
import { formatDate, relativeTime } from "@/lib/datetime";
import { Users, Bus, Truck, Navigation } from "lucide-react";

export default async function SchoolDashboardPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const school = await getSchoolForAdmin(user.id);

  if (!school) {
    return (
      <div className="rounded-card border border-border bg-card p-6 text-sm text-muted-foreground">
        No school profile linked to this account.
      </div>
    );
  }

  const data = await getSchoolDashboard(school.id);

  return (
    <div className="space-y-5">
      <SectionHeader title={school.name} description={`${school.city} · ${school.area ?? ""}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.school.students} value={data.counts.students} icon={<Users size={18} />} tone="primary" />
        <StatCard label={t.admin.totalBuses} value={data.counts.buses} icon={<Bus size={18} />} tone="primary" />
        <StatCard label={t.admin.totalDrivers} value={data.counts.drivers} icon={<Truck size={18} />} tone="success" />
        <StatCard label={t.school.activeRoutes} value={data.counts.routes} icon={<Navigation size={18} />} tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold">Live vehicles</h3>
          {data.live.length > 0 ? (
            <LiveMap
              center={{ lat: data.live[0].lat, lng: data.live[0].lng }}
              zoom={12}
              height={300}
              markers={data.live.map((v) => ({
                id: v.tripId,
                lat: v.lat,
                lng: v.lng,
                label: `${v.busCode} — ${v.driverName}`,
                sublabel: v.stale ? "stale signal" : `${Math.round(v.speed ?? 0)} km/h`,
                kind: "bus",
              }))}
              follow={data.live[0].tripId}
            />
          ) : (
            <p className="grid h-[300px] place-items-center rounded-card bg-muted text-sm text-muted-foreground">
              No buses currently moving.
            </p>
          )}
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 text-sm font-semibold">Today&apos;s attendance</h3>
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <Cell label="Onboard" value={data.attendance.onboard} tone="primary" />
              <Cell label="Dropped" value={data.attendance.dropped} tone="success" />
              <Cell label="Missed" value={data.attendance.missed} tone="warning" />
              <Cell label="Absent" value={data.attendance.absent} tone="danger" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <SectionHeader title="Today's trips" />
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-start">Route</th>
                  <th className="px-4 py-2 text-start">Bus</th>
                  <th className="px-4 py-2 text-start">Driver</th>
                  <th className="px-4 py-2 text-start">When</th>
                  <th className="px-4 py-2 text-start">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.todayTrips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No trips scheduled for today.
                    </td>
                  </tr>
                ) : (
                  data.todayTrips.map((trip) => (
                    <tr key={trip.id} className="border-t border-border">
                      <td className="px-4 py-2">{trip.route.name}</td>
                      <td className="px-4 py-2">
                        <Badge tone="primary">{trip.bus.code}</Badge> {trip.bus.plateNumber}
                      </td>
                      <td className="px-4 py-2">{trip.driver.user.fullName}</td>
                      <td className="px-4 py-2">{formatDate(trip.tripDate, locale)}</td>
                      <td className="px-4 py-2">
                        <StatusBadge status={trip.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">Vehicle updates from: {relativeTime(new Date(), locale)}</p>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: number; tone: "primary" | "success" | "warning" | "danger" }) {
  const tones = { primary: "text-blue-600", success: "text-green-600", warning: "text-amber-600", danger: "text-red-600" } as const;
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <p className={tones[tone]}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}