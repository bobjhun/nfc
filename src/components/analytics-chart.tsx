import type { DailyAnalyticsItem } from "@/lib/analytics";

function points(
  rows: DailyAnalyticsItem[],
  key: "users" | "sessions",
  max: number,
): string {
  const lastIndex = Math.max(rows.length - 1, 1);
  return rows
    .map((row, index) => {
      const x = 8 + (index / lastIndex) * 684;
      const y = 210 - (row[key] / max) * 190;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function AnalyticsChart({ rows }: { rows: DailyAnalyticsItem[] }) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.users, row.sessions]));
  const firstDate = rows[0]?.date;
  const lastDate = rows.at(-1)?.date;
  const dateLabel = (value?: string) =>
    value && /^\d{8}$/.test(value)
      ? new Date(
          Number(value.slice(0, 4)),
          Number(value.slice(4, 6)) - 1,
          Number(value.slice(6, 8)),
        ).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "";

  if (rows.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No daily data is available for this date range.</p>;
  }

  return (
    <>
      <div className="mb-4 flex justify-center gap-5 text-xs text-slate-600">
        <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-blue-600" />Active users</span>
        <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-purple-500" />Sessions</span>
      </div>
      <div className="overflow-x-auto">
        <svg className="h-[220px] min-w-[560px] w-full" viewBox="0 0 700 220" role="img" aria-label="Daily active users and sessions">
          {[52, 106, 160, 210].map((y) => <line key={y} x1="8" y1={y} x2="692" y2={y} stroke="#edf1f7" />)}
          <polyline points={points(rows, "users", max)} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={points(rows, "sessions", max)} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>{dateLabel(firstDate)}</span><span>{dateLabel(lastDate)}</span>
      </div>
    </>
  );
}
