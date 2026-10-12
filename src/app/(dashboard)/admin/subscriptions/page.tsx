import { requireUser } from "@/data/auth";
import { getSubscriptionsAdmin } from "@/data/admin";
import { getT } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";
import { formatDate } from "@/lib/datetime";

export default async function AdminSubscriptionsPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const subs = await getSubscriptionsAdmin();

  return (
    <div className="space-y-5">
      <SectionHeader title={t.nav.admin.subscriptions} description={`${subs.length} subscriptions`} />
      {subs.length === 0 ? (
        <EmptyState title={t.common.noData} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-start">Parent</th>
                  <th className="px-4 py-2 text-start">Student</th>
                  <th className="px-4 py-2 text-start">Plan</th>
                  <th className="px-4 py-2 text-start">Price</th>
                  <th className="px-4 py-2 text-start">Period</th>
                  <th className="px-4 py-2 text-start">Promo</th>
                  <th className="px-4 py-2 text-start">Status</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-2">{s.parent.fullName}</td>
                    <td className="px-4 py-2">{s.student.firstName} {s.student.lastName}</td>
                    <td className="px-4 py-2">{s.plan?.name ?? s.planId}</td>
                    <td className="px-4 py-2">
                      EGP {s.priceEGP.toFixed(2)}
                      {s.discountEGP > 0 ? <span className="text-xs text-success"> −{s.discountEGP.toFixed(2)}</span> : null}
                    </td>
                    <td className="px-4 py-2">
                      {formatDate(s.startDate, locale)} → {formatDate(s.endDate, locale)}
                    </td>
                    <td className="px-4 py-2">{s.promoCode ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Badge tone={s.status === "ACTIVE" ? "success" : s.status === "PENDING" ? "warning" : "neutral"}>
                        {s.status.toLowerCase()}
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