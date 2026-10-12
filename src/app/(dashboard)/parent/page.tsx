import Link from "next/link";
import { requireUser } from "@/data/auth";
import { getParentDashboard } from "@/data/parent";
import { getT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ParentHome, type ChildCard } from "./parent-home";

export default async function ParentDashboardPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const rows = await getParentDashboard(user.id);

  const cards: ChildCard[] = rows.map((r) => ({
    studentId: r.studentId,
    studentName: r.studentName,
    grade: r.grade,
    schoolName: r.schoolName,
    tripStatus: r.tripStatus,
    direction: r.direction,
    busCode: r.busCode,
    plateNumber: r.plateNumber,
    driverName: r.driverName,
    assignmentStatus: r.assignmentStatus,
    etaMinutes: r.etaMinutes,
    distanceKm: r.distanceKm,
    subscriptionStatus: r.subscriptionStatus,
    subscriptionRenewsAt: r.subscriptionRenewsAt?.toISOString() ?? null,
    live: r.live
      ? {
          lat: r.live.lat,
          lng: r.live.lng,
          speed: r.live.speed,
          stale: r.live.stale,
          recordedAt: r.live.recordedAt.toISOString(),
        }
      : null,
  }));

  if (cards.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-semibold tracking-tight">{t.parent.myChildren}</h1>
        <div className="rounded-card border border-dashed border-border bg-card p-10 text-center">
          <p className="font-medium">No children linked yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Add your children and link them to a school to start tracking their bus.
          </p>
          <Link href="/parent/children" className="mt-4 inline-block">
            <Button>Add a child</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <ParentHome locale={locale} t={t} cards={cards} />;
}