import { requireUser } from "@/data/auth";
import { getDriversAdmin } from "@/data/admin";
import { getT } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";
import { formatDate } from "@/lib/datetime";

export default async function AdminDriversPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const drivers = await getDriversAdmin();

  return (
    <div className="space-y-5">
      <SectionHeader title={t.nav.admin.drivers} description={`${drivers.length} driver profiles`} />
      {drivers.length === 0 ? (
        <EmptyState title={t.common.noData} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-start">Driver</th>
                  <th className="px-4 py-2 text-start">Phone</th>
                  <th className="px-4 py-2 text-start">License</th>
                  <th className="px-4 py-2 text-start">Bus</th>
                  <th className="px-4 py-2 text-start">School</th>
                  <th className="px-4 py-2 text-start">Rating</th>
                  <th className="px-4 py-2 text-start">Status</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{d.user.fullName}</td>
                    <td className="px-4 py-2">{d.user.phone}</td>
                    <td className="px-4 py-2">
                      {d.licenseNumber}
                      <span className="ml-1 text-xs text-muted-foreground">{formatDate(d.licenseExpiry, locale)}</span>
                    </td>
                    <td className="px-4 py-2">{d.bus?.code ?? "—"}</td>
                    <td className="px-4 py-2">{d.school?.name ?? "—"}</td>
                    <td className="px-4 py-2">{d.rating.toFixed(1)} ★</td>
                    <td className="px-4 py-2">
                      <Badge tone={d.status === "VERIFIED" ? "success" : d.status === "SUSPENDED" ? "danger" : "warning"}>
                        {d.status.toLowerCase()}
                      </Badge>
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