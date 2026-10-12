import { requireUser } from "@/data/auth";
import { getChildTripHistory, getStudentForGuardian } from "@/data/parent";
import { getT } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";
import { formatDate, relativeTime } from "@/lib/datetime";
import { AddContactForms } from "./add-contact-forms";

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const { locale, t } = await getT();

  const [child, history] = await Promise.all([getStudentForGuardian(user.id, id), getChildTripHistory(user.id, id)]);
  if (!child) notFound();

  const activeSub = child.subscriptions[0] ?? null;

  return (
    <div className="space-y-5">
      <SectionHeader
        title={`${child.firstName} ${child.lastName}`}
        description={`${t.common.grade} ${child.grade} · ${child.school.name}`}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t.parent.childStatus}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <Avatar name={`${child.firstName} ${child.lastName}`} src={child.photoUrl} size={72} />
            <div>
              <p className="text-sm">{t.parent.guardian}s</p>
              {child.guardians.map((g) => (
                <p key={g.userId} className="text-xs text-muted-foreground">
                  {g.user.fullName} · {g.relation} {g.isPrimary ? "· primary" : ""}
                </p>
              ))}
            </div>
            {child.homeAddress ? (
              <p className="text-sm text-muted-foreground">{child.homeAddress.label ?? child.homeAddress.line1}</p>
            ) : null}
            {activeSub ? (
              <div className="flex flex-col gap-1">
                <StatusBadge status={activeSub.status} />
                <span className="text-xs text-muted-foreground">
                  {activeSub.plan?.name ?? "Plan"} · {relativeTime(activeSub.endDate, locale)}
                </span>
              </div>
            ) : (
              <Badge tone="warning">no subscription</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.parent.emergencyContacts}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {child.emergencyContacts.length === 0 ? (
              <p className="text-muted-foreground">{t.common.noData}</p>
            ) : (
              child.emergencyContacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span>{c.name}</span>
                  <span className="text-muted-foreground">{c.phone}</span>
                </div>
              ))
            )}
            <AddContactForms studentId={child.id} kind="emergency" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.parent.authorizedPickup}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {child.pickupPersons.length === 0 ? (
              <p className="text-muted-foreground">{t.common.noData}</p>
            ) : (
              child.pickupPersons.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span>{p.name}</span>
                  <span className="text-muted-foreground">{p.phone}</span>
                </div>
              ))
            )}
            <AddContactForms studentId={child.id} kind="pickup" />
          </CardContent>
        </Card>
      </div>

      <div>
        <SectionHeader title={t.parent.tripHistory} />
        {!history || history.length === 0 ? (
          <EmptyState title={t.common.noData} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-start">{t.common.date}</th>
                    <th className="px-4 py-2 text-start">Route</th>
                    <th className="px-4 py-2 text-start">Direction</th>
                    <th className="px-4 py-2 text-start">{t.common.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {history?.map((h) => (
                    <tr key={h.id} className="border-t border-border">
                      <td className="px-4 py-2">{formatDate(h.trip.tripDate, locale)}</td>
                      <td className="px-4 py-2">{h.trip.route.name} · {h.trip.bus.code}</td>
                      <td className="px-4 py-2">{h.trip.direction === "MORNING" ? "Morning" : "Afternoon"}</td>
                      <td className="px-4 py-2">
                        <StatusBadge status={h.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}