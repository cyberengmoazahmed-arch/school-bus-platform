import Link from "next/link";
import { requireUser } from "@/data/auth";
import { getSchoolForAdmin, getSchoolStudents } from "@/data/school";
import { getT } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";

export default async function SchoolStudentsPage() {
  const user = await requireUser();
  const { t } = await getT();
  const school = await getSchoolForAdmin(user.id);
  if (!school) return <EmptyState title={t.common.noData} />;

  const students = await getSchoolStudents(school.id);

  return (
    <div className="space-y-5">
      <SectionHeader title={`${students.length} students`} description={school.name} />
      {students.length === 0 ? (
        <EmptyState title={t.common.noData} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-start">Name</th>
                  <th className="px-4 py-2 text-start">Grade</th>
                  <th className="px-4 py-2 text-start">Guardians</th>
                  <th className="px-4 py-2 text-start">Address</th>
                  <th className="px-4 py-2 text-start">Plan</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="px-4 py-2">{s.grade}</td>
                    <td className="px-4 py-2">
                      {s.guardians.map((g) => (
                        <span key={g.userId} className="mr-2 text-muted-foreground">
                          {g.user.fullName}
                          {g.isPrimary ? " ★" : ""}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {s.homeAddress?.line1 ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      {s.subscriptions[0] ? (
                        <Link href="/school/routes">
                          <Badge tone="success">{s.subscriptions[0].plan?.name ?? "Active"}</Badge>
                        </Link>
                      ) : (
                        <Badge tone="neutral">No plan</Badge>
                      )}
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