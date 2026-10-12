"use client";

const MAX_BAR = 120;

export function RevenueChart({ data }: { data: { date: string; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const hasData = data.some((d) => d.total > 0);

  return (
    <div className="rounded-card border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">Daily revenue (EGP)</h3>
      {hasData ? (
        <div className="flex h-64 items-end gap-1">
          {data.map((d) => (
            <div key={d.date} className="group flex flex-1 flex-col items-center gap-1">
              <div className="relative flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-sm bg-primary/80 transition-colors group-hover:bg-primary"
                  title={`${d.date}: EGP ${d.total.toFixed(2)}`}
                  style={{ height: `${Math.min((d.total / max) * 100, MAX_BAR)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="grid h-64 place-items-center text-sm text-muted-foreground">No revenue recorded in this window.</p>
      )}
    </div>
  );
}