import { requireUser } from "@/data/auth";
import { getSchoolForAdmin } from "@/data/school";
import { getT } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, SectionHeader } from "@/components/ui/misc";
import { formatDate } from "@/lib/datetime";
import { Download } from "lucide-react";

export default async function SchoolReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const { from, to } = await searchParams;
  const user = await requireUser();
  const { locale, t } = await getT();
  const school = await getSchoolForAdmin(user.id);
  if (!school) return <EmptyState title={t.common.noData} />;

  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 13 * 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const exportUrl = `/api/reports/attendance.xlsx?schoolId=${school.id}&from=${encodeURIComponent(iso(fromDate))}&to=${encodeURIComponent(iso(toDate))}`;

  return (
    <div className="space-y-5">
      <SectionHeader title={t.school.attendanceReport} description={school.name} />

      <Card>
        <CardContent className="p-5">
          <form action="/school/reports" method="get" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="schoolId" value={school.id} />
            <label className="text-sm">
              From
              <input type="date" name="from" defaultValue={iso(fromDate)} className="block rounded border border-border px-3 py-1.5 text-sm" />
            </label>
            <label className="text-sm">
              To
              <input type="date" name="to" defaultValue={iso(toDate)} className="block rounded border border-border px-3 py-1.5 text-sm" />
            </label>
            <button type="submit" className="rounded bg-primary px-4 py-1.5 text-sm font-medium text-white">
              Update
            </button>
            <a href={exportUrl} className="rounded border border-border px-4 py-1.5 text-sm font-medium hover:bg-muted">
              <Download size={14} className="inline" /> {t.school.exportExcel}
            </a>
          </form>

          <p className="mt-3 text-xs text-muted-foreground">
            Range: {formatDate(fromDate, locale)} → {formatDate(toDate, locale)}. The export streams the per-student attendance summary as .xlsx.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Badge tone="info">{from ? formatDate(fromDate, locale) : "Default"}</Badge>
        <Badge tone="primary">{to ? formatDate(toDate, locale) : "today"}</Badge>
      </div>
    </div>
  );
}