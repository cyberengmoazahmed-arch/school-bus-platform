import { requireUser } from "@/data/auth";
import { getTicketsAdmin } from "@/data/admin";
import { getT } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/datetime";

export default async function AdminSupportPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const tickets = await getTicketsAdmin();

  return (
    <div className="space-y-5">
      <SectionHeader title={t.nav.admin.tickets} description={`${tickets.length} tickets`} />
      {tickets.length === 0 ? (
        <EmptyState title={t.common.noData} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-start">Subject</th>
                  <th className="px-4 py-2 text-start">Requester</th>
                  <th className="px-4 py-2 text-start">Category</th>
                  <th className="px-4 py-2 text-start">Priority</th>
                  <th className="px-4 py-2 text-start">Assignee</th>
                  <th className="px-4 py-2 text-start">When</th>
                  <th className="px-4 py-2 text-start">Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((x) => (
                  <tr key={x.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{x.subject}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {x.requester.fullName} ({x.requester.role.toLowerCase()})
                    </td>
                    <td className="px-4 py-2">{x.category.replaceAll("_", " ")}</td>
                    <td className="px-4 py-2">
                      <Badge tone={x.priority === "URGENT" ? "danger" : x.priority === "HIGH" ? "warning" : "neutral"}>
                        {x.priority.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">{x.assignee?.fullName ?? "—"}</td>
                    <td className="px-4 py-2">{formatDateTime(x.createdAt, locale)}</td>
                    <td className="px-4 py-2">
                      <Badge tone={x.status === "RESOLVED" ? "success" : x.status === "IN_PROGRESS" ? "warning" : "info"}>
                        {x.status.toLowerCase()}
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