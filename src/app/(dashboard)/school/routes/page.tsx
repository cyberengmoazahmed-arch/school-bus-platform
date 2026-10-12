import { requireUser } from "@/data/auth";
import { getSchoolForAdmin, getSchoolRoutes } from "@/data/school";
import { getT } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";

export default async function SchoolRoutesPage() {
  const user = await requireUser();
  const { t } = await getT();
  const school = await getSchoolForAdmin(user.id);
  if (!school) return <EmptyState title={t.common.noData} />;

  const routes = await getSchoolRoutes(school.id);

  return (
    <div className="space-y-5">
      <SectionHeader title={t.school.activeRoutes} description={school.name} />
      {routes.length === 0 ? (
        <EmptyState title={t.common.noData} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {routes.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.stops.length} stop(s) · {r.direction.toLowerCase()} · {r.distanceKm} km · est. {r.estDurationMin} min
                    </p>
                  </div>
                  <Badge tone={r.status === "ACTIVE" ? "success" : "neutral"}>{r.status.toLowerCase()}</Badge>
                </div>

                <ol className="mt-3 space-y-1 text-sm">
                  {r.stops.map((stop, i) => (
                    <li key={stop.id} className="flex items-center gap-2">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{stop.addressLabel}</span>
                      <span className="ml-auto text-right text-xs text-muted-foreground">
                        {stop.student ? `${stop.student.firstName} ${stop.student.lastName}` : "—"}
                      </span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}