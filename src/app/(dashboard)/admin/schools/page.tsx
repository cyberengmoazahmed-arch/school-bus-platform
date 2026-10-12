import { requireUser } from "@/data/auth";
import { getSchoolsAdmin } from "@/data/admin";
import { getT } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";

export default async function AdminSchoolsPage() {
  const user = await requireUser();
  const { t } = await getT();
  const schools = await getSchoolsAdmin();

  return (
    <div className="space-y-5">
      <SectionHeader title={t.nav.admin.schools} description={`${schools.length} partner schools`} />
      {schools.length === 0 ? (
        <EmptyState title={t.common.noData} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{s.name}</p>
                  <Badge tone="primary">{s.code}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[s.area, s.city].filter(Boolean).join(", ")} · {s.phone ?? "no phone"}
                </p>
                <div className="mt-3 flex gap-2 text-xs">
                  <span className="rounded bg-muted px-2 py-0.5">{s._count.students} students</span>
                  <span className="rounded bg-muted px-2 py-0.5">{s._count.drivers} drivers</span>
                  <span className="rounded bg-muted px-2 py-0.5">{s._count.routes} routes</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}