import { requireUser } from "@/data/auth";
import { getAuditLogs } from "@/data/admin";
import { getT } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/datetime";

export default async function AdminAuditPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const logs = await getAuditLogs(150);

  return (
    <div className="space-y-5">
      <SectionHeader title={t.nav.admin.audit} description="Append-only audit trail — last 150 entries" />
      {logs.length === 0 ? (
        <EmptyState title={t.common.noData} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-start">When</th>
                  <th className="px-4 py-2 text-start">Actor</th>
                  <th className="px-4 py-2 text-start">Action</th>
                  <th className="px-4 py-2 text-start">Entity</th>
                  <th className="px-4 py-2 text-start">Id</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="px-4 py-2">{formatDateTime(l.createdAt, locale)}</td>
                    <td className="px-4 py-2">
                      {l.actor?.fullName ?? "—"}
                      {l.actor ? <span className="ml-1 text-xs text-muted-foreground">({l.actor.role})</span> : null}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{l.action}</td>
                    <td className="px-4 py-2">{l.entity}</td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{l.entityId ?? "—"}</td>
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