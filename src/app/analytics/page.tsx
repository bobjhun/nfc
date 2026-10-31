import type { Metadata } from "next";
import {
  Activity,
  Eye,
  MousePointerClick,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { AnalyticsChart } from "@/components/analytics-chart";
import { AnalyticsRanking } from "@/components/analytics-ranking";
import { PageHeading } from "@/components/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsReport } from "@/lib/analytics";
import { getGa4Configuration } from "@/lib/ga4-config";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const metricCards = [
  { key: "activeUsers", label: "Active users", detail: "Users who engaged with your site or app", icon: UsersRound, tone: "bg-blue-50 text-blue-700" },
  { key: "newUsers", label: "New users", detail: "First-time users", icon: UserRoundPlus, tone: "bg-purple-50 text-purple-700" },
  { key: "sessions", label: "Sessions", detail: "Total sessions", icon: Activity, tone: "bg-teal-50 text-teal-700" },
  { key: "pageViews", label: "Page views", detail: "Views across pages and screens", icon: Eye, tone: "bg-amber-50 text-amber-700" },
  { key: "engagementRate", label: "Engagement rate", detail: "Engaged sessions ÷ total sessions", icon: MousePointerClick, tone: "bg-rose-50 text-rose-700" },
] as const;

function metricText(
  report: NonNullable<Awaited<ReturnType<typeof getAnalyticsReport>>> | null,
  key: (typeof metricCards)[number]["key"],
) {
  if (!report) return "—";
  if (key === "engagementRate") return `${(report.engagementRate * 100).toFixed(1)}%`;
  return report[key].toLocaleString();
}

export default async function AnalyticsPage() {
  let report = null;
  let errorMessage = "";
  let configuredPropertyId = "";
  try {
    const configuration = await getGa4Configuration();
    configuredPropertyId = configuration?.propertyId ?? "";
    if (configuration) report = await getAnalyticsReport();
  } catch (error) {
    console.error("Could not load Google Analytics report:", error);
    errorMessage = configuredPropertyId
      ? "GA4 could not return reports. Confirm the Data API is enabled and the service account has Viewer access to this property."
      : "The database is unavailable. Check your MySQL settings and try again.";
  }

  const notice = errorMessage
    ? errorMessage
    : !configuredPropertyId
      ? "Connect a GA4 property in Configuration to see your reports."
      : null;

  return (
    <>
      <PageHeading
        title="Analytics"
        description="Google Analytics 4 performance over the last 30 days."
      />
      {notice && (
        <div role="status" className="mb-5 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 sm:flex-row sm:items-center sm:justify-between">
          <span>{notice}</span>
          {!configuredPropertyId && <a className="font-semibold underline underline-offset-4" href="/configuration">Open Configuration</a>}
        </div>
      )}
      {report && (
        <p className="mb-4 text-xs text-slate-500">
          GA4 Property ID: <strong className="font-semibold text-slate-700">{report.propertyId}</strong>
          <span className="mx-2">·</span>Last 30 days
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Google Analytics summary">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.key} className="gap-3 py-4 shadow-sm">
              <CardContent className="flex gap-3 px-4">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${metric.tone}`}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-500">{metric.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-[#0f1c33]">{metricText(report, metric.key)}</p>
                  <p className="mt-1 text-[9px] leading-relaxed text-slate-400">{metric.detail}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-5 grid items-start gap-4 xl:grid-cols-2">
        <Card className="gap-4 py-5 shadow-sm xl:col-span-2">
          <CardHeader className="px-5"><CardTitle className="text-base">Users &amp; sessions</CardTitle><p className="text-xs text-slate-500">Daily activity during the last 30 days</p></CardHeader>
          <CardContent className="px-5">
            {report ? <AnalyticsChart rows={report.daily} /> : <p className="py-12 text-center text-sm text-muted-foreground">Reports will appear after GA4 is connected.</p>}
          </CardContent>
        </Card>
        <AnalyticsRanking title="Top pages" subtitle="By page views" items={report?.topPages ?? []} />
        <AnalyticsRanking title="Sessions by channel" subtitle="Default channel group" items={report?.channels ?? []} />
        <AnalyticsRanking title="Users by device" subtitle="Device category" items={report?.devices ?? []} />
        <AnalyticsRanking title="Top countries" subtitle="By active users" items={report?.countries ?? []} />
      </section>
    </>
  );
}
