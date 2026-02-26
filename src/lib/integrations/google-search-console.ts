import type { SearchConsoleMetrics } from "@/types/integrations";

interface FetchOptions {
  accessToken: string;
  siteUrl: string;
  startDate: string;
  endDate: string;
}

export async function fetchSearchConsoleMetrics(
  options: FetchOptions
): Promise<SearchConsoleMetrics> {
  const { accessToken, siteUrl, startDate, endDate } = options;

  const encodedSite = encodeURIComponent(siteUrl);
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 50,
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("GSC_RATE_LIMIT");
    }
    throw new Error(`Search Console API error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    rows?: Array<{
      keys: string[];
      clicks: number;
      impressions: number;
    }>;
  };

  const rows = data.rows ?? [];
  const queries = rows.map((row) => ({
    query: row.keys?.[0] ?? "",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
  }));

  return {
    queries,
    totalClicks: rows.reduce((s, r) => s + (r.clicks ?? 0), 0),
    totalImpressions: rows.reduce((s, r) => s + (r.impressions ?? 0), 0),
  };
}
