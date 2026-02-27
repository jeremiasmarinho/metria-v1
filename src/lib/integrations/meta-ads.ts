import type { MetaAdsMetrics } from "@/types/integrations";

interface FetchOptions {
  accessToken: string;
  adAccountId: string;
  startDate: string;
  endDate: string;
}

export async function fetchMetaAdsMetrics(options: FetchOptions): Promise<MetaAdsMetrics> {
  const { accessToken, adAccountId, startDate, endDate } = options;
  const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

  const params = new URLSearchParams({
    fields: "spend,reach,impressions,clicks,actions",
    time_range: JSON.stringify({
      since: startDate.replace(/-/g, ""),
      until: endDate.replace(/-/g, ""),
    }),
    access_token: accessToken,
  });

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/insights?${params}`
  );

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("META_RATE_LIMIT");
    }
    if (response.status === 401) {
      throw new Error("META_AUTH_401");
    }
    if (response.status === 403) {
      throw new Error("META_AUTH_403");
    }
    throw new Error(`Meta Ads API error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    data?: Array<{
      spend?: string;
      reach?: string;
      impressions?: string;
      clicks?: string;
      actions?: Array<{ action_type: string; value: string }>;
    }>;
  };

  const rows = data.data ?? [];
  const totals = rows.reduce(
    (acc, row) => {
      const spend = parseFloat(row.spend ?? "0");
      const reach = parseInt(row.reach ?? "0", 10);
      const impressions = parseInt(row.impressions ?? "0", 10);
      const clicks = parseInt(row.clicks ?? "0", 10);
      const conversions = row.actions?.find((a) => a.action_type === "purchase")
        ? parseFloat(row.actions.find((a) => a.action_type === "purchase")!.value)
        : 0;
      return {
        spend: acc.spend + spend,
        reach: acc.reach + reach,
        impressions: acc.impressions + impressions,
        clicks: acc.clicks + clicks,
        conversions: acc.conversions + conversions,
      };
    },
    { spend: 0, reach: 0, impressions: 0, clicks: 0, conversions: 0 }
  );

  return {
    spend: Math.round(totals.spend * 100) / 100,
    reach: totals.reach,
    impressions: totals.impressions,
    clicks: totals.clicks,
    conversions: Math.round(totals.conversions),
  };
}
