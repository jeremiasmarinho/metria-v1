import type { GoogleAnalyticsMetrics } from "@/types/integrations";

interface FetchOptions {
  clientId: string;
  accessToken: string;
  propertyId: string;
  startDate: string;
  endDate: string;
}

export async function fetchGoogleAnalyticsMetrics(
  options: FetchOptions
): Promise<GoogleAnalyticsMetrics> {
  const { accessToken, propertyId, startDate, endDate } = options;

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
          { name: "conversions" },
        ],
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("GA_RATE_LIMIT");
    }
    throw new Error(`Google Analytics API error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    rows?: Array<{ metricValues: Array<{ value: string }> }>;
  };

  if (!data.rows || data.rows.length === 0) {
    return {
      users: 0,
      sessions: 0,
      pageviews: 0,
      bounceRate: 0,
      avgSessionDuration: 0,
      conversions: 0,
    };
  }

  const totals = data.rows.reduce(
    (acc, row) => {
      const values = row.metricValues?.map((v) => parseFloat(v.value)) ?? [];
      return {
        users: acc.users + (values[0] ?? 0),
        sessions: acc.sessions + (values[1] ?? 0),
        pageviews: acc.pageviews + (values[2] ?? 0),
        bounceRate: acc.bounceRate + (values[3] ?? 0),
        avgSessionDuration: acc.avgSessionDuration + (values[4] ?? 0),
        conversions: acc.conversions + (values[5] ?? 0),
      };
    },
    { users: 0, sessions: 0, pageviews: 0, bounceRate: 0, avgSessionDuration: 0, conversions: 0 }
  );

  const count = data.rows.length;
  return {
    users: Math.round(totals.users),
    sessions: Math.round(totals.sessions),
    pageviews: Math.round(totals.pageviews),
    bounceRate: count > 0 ? Math.round((totals.bounceRate / count) * 100) / 100 : 0,
    avgSessionDuration: count > 0 ? Math.round(totals.avgSessionDuration / count) : 0,
    conversions: Math.round(totals.conversions),
  };
}
