import "server-only";

import { BetaAnalyticsDataClient, type protos } from "@google-analytics/data";
import { getGa4Configuration, readGa4Credentials } from "@/lib/ga4-config";

export interface AnalyticsItem {
  name: string;
  value: number;
}

export interface DailyAnalyticsItem {
  date: string;
  users: number;
  sessions: number;
}

export interface AnalyticsReport {
  propertyId: string;
  activeUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  engagementRate: number;
  daily: DailyAnalyticsItem[];
  topPages: AnalyticsItem[];
  channels: AnalyticsItem[];
  devices: AnalyticsItem[];
  countries: AnalyticsItem[];
}

function numberValue(value: string | null | undefined): number {
  const parsed = Number(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function itemsFromReport(
  rows:
    | Array<{
        dimensionValues?: Array<{ value?: string | null } | null> | null;
        metricValues?: Array<{ value?: string | null } | null> | null;
      }>
    | null
    | undefined,
  metricIndex = 0,
  formatName?: (name: string) => string,
): AnalyticsItem[] {
  return (rows ?? []).map((row) => {
    const name = row.dimensionValues?.[0]?.value ?? "(not set)";
    return {
      name: formatName ? formatName(name) : name,
      value: numberValue(row.metricValues?.[metricIndex]?.value),
    };
  });
}

export async function getAnalyticsReport(): Promise<AnalyticsReport | null> {
  const configuration = await getGa4Configuration();
  if (!configuration) return null;

  const credentials = await readGa4Credentials(configuration.credentialFile);
  const client = new BetaAnalyticsDataClient({
    credentials: {
      client_email: String(credentials.client_email),
      private_key: String(credentials.private_key),
    },
    projectId: String(credentials.project_id),
    fallback: true,
  });

  const property = `properties/${configuration.propertyId}`;
  const dateRanges = [{ startDate: "29daysAgo", endDate: "today" }];
  const requests: protos.google.analytics.data.v1beta.IRunReportRequest[] = [
    {
      property,
      dateRanges,
      metrics: [
        { name: "activeUsers" },
        { name: "newUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "engagementRate" },
      ],
    },
    {
      property,
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "sessions" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    },
    {
      property,
      dateRanges,
      dimensions: [{ name: "pageTitle" }],
      metrics: [{ name: "screenPageViews" }],
      limit: 8,
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    },
    {
      property,
      dateRanges,
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      limit: 8,
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    },
    {
      property,
      dateRanges,
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    },
    {
      property,
      dateRanges,
      dimensions: [{ name: "country" }],
      metrics: [{ name: "activeUsers" }],
      limit: 8,
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    },
  ];

  try {
    const reports = await Promise.all(
      requests.map((request) => client.runReport(request)),
    );
    const summary = reports[0][0].rows?.[0]?.metricValues ?? [];
    const daily = (reports[1][0].rows ?? []).map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? "",
      users: numberValue(row.metricValues?.[0]?.value),
      sessions: numberValue(row.metricValues?.[1]?.value),
    }));

    return {
      propertyId: configuration.propertyId,
      activeUsers: numberValue(summary[0]?.value),
      newUsers: numberValue(summary[1]?.value),
      sessions: numberValue(summary[2]?.value),
      pageViews: numberValue(summary[3]?.value),
      engagementRate: numberValue(summary[4]?.value),
      daily,
      topPages: itemsFromReport(reports[2][0].rows),
      channels: itemsFromReport(reports[3][0].rows),
      devices: itemsFromReport(reports[4][0].rows, 0, (name) =>
        name ? name[0].toUpperCase() + name.slice(1) : name,
      ),
      countries: itemsFromReport(reports[5][0].rows),
    };
  } finally {
    await client.close();
  }
}
