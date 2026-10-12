import Link from "next/link";
import { requireUser } from "@/data/auth";
import { getChildrenForParent } from "@/data/parent";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { AddChildForm } from "./add-child-form";

export default async function ChildrenPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const [children, schools, subscriptions] = await Promise.all([
    getChildrenForParent(user.id),
    prisma.school.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.subscription.findMany({
      where: { parentId: user.id, status: "ACTIVE" },
      select: { studentId: true },
    }),
  ]);

  const subscribed = new Set(subscriptions.map((s) => s.studentId));

  return (
    <div className="space-y-5">
      <SectionHeader title={t.parent.myChildren} description={t.common.school} action={<></>} />
      <AddChildForm locale={locale} schools={schools.map((s) => ({ id: s.id, name: s.name, city: s.city }))} />

      {children.length === 0 ? (
        <EmptyState title={t.common.noData} description="Use the form above to add your first child." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((c) => (
            <Link key={c.id} href={`/parent/children/${c.id}`} className="group">
              <Card className="transition-shadow group-hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <Avatar name={`${c.firstName} ${c.lastName}`} src={c.photoUrl} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {t.common.grade} {c.grade} · {c.school.name}
                    </p>
                  </div>
                  {subscribed.has(c.id) ? <Badge tone="success">subscribed</Badge> : <Badge tone="neutral">no plan</Badge>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}