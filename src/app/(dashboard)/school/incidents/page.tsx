import { requireUser } from "@/data/auth";
import { getSchoolForAdmin, getSchoolIncidents } from "@/data/school";
import { getT } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/datetime";

const toneFor = (s: string) =>
  ({ CRITICAL: "danger", HIGH: "warning", MEDIUM: "info", LOW: "neutral" } as const)[s] ?? "neutral";

const toneForStatus = (s: string) =>
  s === "RESOLVED" ? "success" : s === "ACKNOWLEDGED" ? "warning" : "info";

export default async function SchoolIncidentsPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const school = await getSchoolForAdmin(user.id);
  if (!school) return <EmptyState title={t.common.noData} />;

  const incidents = await getSchoolIncidents(school.id);

  return (
    <div className="space-y-5">
      <SectionHeader title="Incidents" description={school.name} />
      {incidents.length === 0 ? (
        <EmptyState title={t.common.noData} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-start">Type</th>
                  <th className="px-4 py-2 text-start">Severity</th>
                  <th className="px-4 py-2 text-start">Student</th>
                  <th className="px-4 py-2 text-start">Reporter</th>
                  <th className="px-4 py-2 text-start">When</th>
                  <th className="px-4 py-2 text-start">Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((i) => (
                  <tr key={i.id} className="border-t border-border">
                    <td className="px-4 py-2">{i.type.replaceAll("_", " ")}</td>
                    <td className="px-4 py-2">
                      <Badge tone={toneFor(i.severity)}>{i.severity.toLowerCase()}</Badge>
                    </td>
                    <td className="px-4 py-2">{i.student ? `${i.student.firstName} ${i.student.lastName}` : "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{i.reportedBy.fullName}</td>
                    <td className="px-4 py-2">{formatDateTime(i.createdAt, locale)}</td>
                    <td className="px-4 py-2">
                      <Badge tone={toneForStatus(i.status)}>{i.status.toLowerCase()}</Badge>
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