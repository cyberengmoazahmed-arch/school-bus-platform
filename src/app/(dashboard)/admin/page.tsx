import { requireUser } from "@/data/auth";
import { getDailyRevenue, getPlatformStats } from "@/data/admin";
import { getT } from "@/lib/i18n";
import { StatCard } from "@/components/ui/misc";
import { LiveMap } from "@/components/maps/live-map";
import { Users, GraduationCap, School, Bus, Banknote, AlertTriangle } from "lucide-react";
import { RevenueChart } from "./revenue-chart";

export default async function AdminDashboardPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const [stats, daily] = await Promise.all([getPlatformStats(), getDailyRevenue(14)]);

  const revenueTiles = [
    { label: "MRR (EGP)", value: stats.revenue.mrr.toFixed(0), tone: "primary" },
    { label: "Collected this month", value: stats.revenue.collectedThisMonth.toFixed(0), tone: "success" },
    { label: "Open incidents", value: stats.operations.openIncidents, tone: "danger" },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Platform overview</h1>
        <p className="text-sm text-muted-foreground">Fleet-wide health, revenue and safety at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.admin.totalParents} value={stats.counts.parents} icon={<Users size={18} />} tone="primary" />
        <StatCard label={t.admin.totalStudents} value={stats.counts.students} icon={<GraduationCap size={18} />} tone="primary" />
        <StatCard label={t.admin.totalSchools} value={stats.counts.schools} icon={<School size={18} />} tone="success" />
        <StatCard label={t.admin.totalBuses} value={stats.counts.buses} icon={<Bus size={18} />} tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {revenueTiles.map((r) => (
          <div key={r.label} className="rounded-card border border-border bg-card p-4">
            <StatCard label={r.label} value={typeof r.value === "string" ? r.value : String(r.value)} icon={<Banknote size={18} />} tone={r.tone} />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <RevenueChart data={daily} />
        <div>
          <h3 className="mb-2 text-sm font-semibold">Live buses</h3>
          {stats.live.length > 0 ? (
            <LiveMap
              center={{ lat: stats.live[0].lat, lng: stats.live[0].lng }}
              zoom={11}
              height={300}
              markers={stats.live.map((v) => ({
                id: v.tripId,
                lat: v.lat,
                lng: v.lng,
                label: `${v.busCode} — ${v.driverName}`,
                kind: "bus",
              }))}
              follow={stats.live[0].tripId}
            />
          ) : (
            <p className="grid h-[300px] place-items-center rounded-card bg-muted text-sm text-muted-foreground">
              No live buses.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}