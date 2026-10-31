import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsItem } from "@/lib/analytics";

export function AnalyticsRanking({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: AnalyticsItem[];
}) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <Card className="gap-3 py-5 shadow-sm">
      <CardHeader className="px-5">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </CardHeader>
      <CardContent className="px-5">
        {items.length === 0 ? (
          <p className="py-7 text-sm text-muted-foreground">No data is available.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.name}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-slate-700">{item.name}</span>
                  <strong className="shrink-0 font-semibold text-[#0f1c33]">
                    {item.value.toLocaleString()}
                  </strong>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-500"
                    style={{ width: `${Math.min(100, (item.value / max) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
