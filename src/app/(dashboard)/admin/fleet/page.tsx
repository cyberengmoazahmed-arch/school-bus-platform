import { requireUser } from "@/data/auth";
import { getFleet } from "@/data/admin";
import { getT } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";
import { formatDate } from "@/lib/datetime";

export default async function AdminFleetPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const fleet = await getFleet();

  return (
    <div className="space-y-5">
      <SectionHeader title={t.nav.admin.fleet} description={`${fleet.length} buses registered`} />
      {fleet.length === 0 ? (
        <EmptyState title={t.common.noData} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-start">Code</th>
                  <th className="px-4 py-2 text-start">Plate</th>
                  <th className="px-4 py-2 text-start">Model</th>
                  <th className="px-4 py-2 text-start">Capacity</th>
                  <th className="px-4 py-2 text-start">Driver</th>
                  <th className="px-4 py-2 text-start">Insurance</th>
                  <th className="px-4 py-2 text-start">Status</th>
                </tr>
              </thead>
              <tbody>
                {fleet.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="px-4 py-2 font-mono font-medium">{b.code}</td>
                    <td className="px-4 py-2">{b.plateNumber}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {[b.make, b.model].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-4 py-2">{b.capacity}</td>
                    <td className="px-4 py-2">
                      {b.drivers[0]?.user.fullName ?? <span className="text-muted-foreground">Unassigned</span>}
                    </td>
                    <td className="px-4 py-2">{b.insuranceExpiry ? formatDate(b.insuranceExpiry, locale) : "—"}</td>
                    <td className="px-4 py-2">
                      <Badge tone={b.status === "ACTIVE" ? "success" : "warning"}>{b.status.toLowerCase()}</Badge>
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