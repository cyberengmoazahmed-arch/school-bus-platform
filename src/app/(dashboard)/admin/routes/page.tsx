import { requireUser } from "@/data/auth";
import { getRoutesAdmin } from "@/data/admin";
import { getT } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";
import { formatDate } from "@/lib/datetime";

export default async function AdminRoutesPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const routes = await getRoutesAdmin();

  return (
    <div className="space-y-5">
      <SectionHeader title={t.nav.admin.routes} description={`${routes.length} routes`} />
      {routes.length === 0 ? (
        <EmptyState title={t.common.noData} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-start">Name</th>
                  <th className="px-4 py-2 text-start">School</th>
                  <th className="px-4 py-2 text-start">Direction</th>
                  <th className="px-4 py-2 text-start">Stops</th>
                  <th className="px-4 py-2 text-start">Distance</th>
                  <th className="px-4 py-2 text-start">Next trip</th>
                  <th className="px-4 py-2 text-start">Status</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{r.name}</td>
                    <td className="px-4 py-2">{r.school.name}</td>
                    <td className="px-4 py-2">{r.direction.toLowerCase()}</td>
                    <td className="px-4 py-2">{r.stops.length}</td>
                    <td className="px-4 py-2">{r.distanceKm} km</td>
                    <td className="px-4 py-2">
                      {r.trips[0] ? formatDate(r.trips[0].tripDate, locale) : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <Badge tone={r.status === "ACTIVE" ? "success" : "neutral"}>{r.status.toLowerCase()}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}