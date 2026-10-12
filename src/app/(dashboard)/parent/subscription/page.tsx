import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/data/auth";
import { getParentInvoices, getParentPayments, getSubscriptionsForParent } from "@/data/parent";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { SubscribeForm } from "./subscribe-form";
import { SubscriptionActions } from "./subscription-actions";

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const { paid } = await searchParams;
  const user = await requireUser();
  const { locale, t } = await getT();

  const [subs, invoices, payments, plans, children] = await Promise.all([
    getSubscriptionsForParent(user.id),
    getParentInvoices(user.id),
    getParentPayments(user.id),
    prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { basePrice: "asc" } }),
    prisma.student.findMany({ where: { guardians: { some: { userId: user.id } }, isActive: true }, include: { school: true } }),
  ]);

  const busyStudentIds = new Set(
    subs.filter((s) => ["ACTIVE", "PENDING"].includes(s.status)).map((s) => s.studentId),
  );
  const availableChildren = children.filter((c) => !busyStudentIds.has(c.id));

  return (
    <div className="space-y-5">
      {paid ? (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200">
          Payment received — your subscription is now active. Welcome aboard!
        </div>
      ) : null}

      <SectionHeader title={t.parent.subscription} description={t.nav.parent.pricing} />

      {availableChildren.length > 0 && plans.length > 0 ? (
        <Suspense>
          <SubscribeForm
            locale={locale}
            students={availableChildren.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, school: c.school.name }))}
            plans={plans.map((p) => ({
              id: p.id,
              name: p.name,
              planType: p.planType,
              serviceType: p.serviceType,
              basePrice: p.basePrice,
              perKmPrice: p.perKmPrice,
              description: p.description,
            }))}
          />
        </Suspense>
      ) : (
        <p className="text-sm text-muted-foreground">
          {availableChildren.length === 0 ? "All your children have an active subscription." : "No plans available."}
        </p>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Subscriptions</h2>
        {subs.length === 0 ? (
          <EmptyState title={t.common.noData} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {subs.map((s) => (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span>{s.student.firstName} {s.student.lastName} · {s.plan?.name ?? "Plan"}</span>
                    <StatusBadge status={s.status} />
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    EGP {s.priceEGP.toFixed(2)}
                    {s.discountEGP > 0 ? <span className="text-success"> − {s.discountEGP.toFixed(2)}</span> : null}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(s.startDate, locale)} → {formatDate(s.endDate, locale)}
                    {s.promoCode ? ` · promo ${s.promoCode}` : ""}
                  </p>
                  {["ACTIVE", "PAUSED"].includes(s.status) ? (
                    <div className="mt-3 flex gap-2">
                      <SubscriptionActions subscriptionId={s.id} status={s.status} />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Invoices</h2>
          {invoices.length === 0 ? (
            <EmptyState title={t.common.noData} />
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-start">Number</th>
                      <th className="px-4 py-2 text-start">Date</th>
                      <th className="px-4 py-2 text-start">Total</th>
                      <th className="px-4 py-2 text-start">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((i) => (
                      <tr key={i.id} className="border-t border-border">
                        <td className="px-4 py-2 font-mono text-xs">{i.number}</td>
                        <td className="px-4 py-2">{formatDate(i.issuedAt, locale)}</td>
                        <td className="px-4 py-2">EGP {i.totalEGP.toFixed(2)}</td>
                        <td className="px-4 py-2">
                          <StatusBadge status={i.status} />
                          {i.status === "PAID" ? <Badge tone="success">paid</Badge> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Payments</h2>
          {payments.length === 0 ? (
            <EmptyState title={t.common.noData} />
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-start">When</th>
                      <th className="px-4 py-2 text-start">Method</th>
                      <th className="px-4 py-2 text-start">Amount</th>
                      <th className="px-4 py-2 text-start">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-4 py-2">{formatDateTime(p.createdAt, locale)}</td>
                        <td className="px-4 py-2">{p.method}</td>
                        <td className="px-4 py-2">EGP {p.amountEGP.toFixed(2)}</td>
                        <td className="px-4 py-2">
                          <StatusBadge status={p.status} />
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

      <p className="text-sm text-muted-foreground">
        Need help?{" "}
        <Link href="/parent/support" className="text-primary underline">
          Contact support
        </Link>
      </p>
    </div>
  );
}