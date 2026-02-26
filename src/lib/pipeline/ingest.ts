import { db } from "@/lib/db";
import type { ClientIntegrations } from "@/types/client";
import { fetchGoogleAnalyticsMetrics } from "@/lib/integrations/google-analytics";
import { fetchSearchConsoleMetrics } from "@/lib/integrations/google-search-console";
import { fetchMetaAdsMetrics } from "@/lib/integrations/meta-ads";
import type { MetricSource } from "@prisma/client";

function getMonthRange(period: Date): { start: string; end: string } {
  const start = new Date(period.getFullYear(), period.getMonth(), 1);
  const end = new Date(period.getFullYear(), period.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export async function ingestClientMetrics(
  clientId: string,
  agencyId: string,
  period: Date
): Promise<void> {
  const client = await db.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const integrations = client.integrations as unknown as ClientIntegrations;
  const { start: startDate, end: endDate } = getMonthRange(period);

  const sourcesToFetch: Array<{ source: MetricSource; fn: () => Promise<object> }> = [];

  if (integrations.google?.accessToken) {
    const tokens = integrations.google;
    const accessToken = tokens.accessToken; // TODO: refresh if expired
    const reportConfig = client.reportConfig as { googlePropertyId?: string; googleSiteUrl?: string };
    if (reportConfig?.googlePropertyId) {
      sourcesToFetch.push({
        source: "GOOGLE_ANALYTICS",
        fn: () =>
          fetchGoogleAnalyticsMetrics({
            clientId,
            accessToken,
            propertyId: reportConfig.googlePropertyId!,
            startDate,
            endDate,
          }),
      });
    }
    if (reportConfig?.googleSiteUrl) {
      sourcesToFetch.push({
        source: "GOOGLE_SEARCH_CONSOLE",
        fn: () =>
          fetchSearchConsoleMetrics({
            accessToken,
            siteUrl: reportConfig.googleSiteUrl!,
            startDate,
            endDate,
          }),
      });
    }
  }

  if (integrations.meta?.accessToken) {
    const meta = integrations.meta;
    const reportConfig = client.reportConfig as { metaAdAccountId?: string };
    if (reportConfig?.metaAdAccountId) {
      sourcesToFetch.push({
        source: "META_ADS",
        fn: () =>
          fetchMetaAdsMetrics({
            accessToken: meta.accessToken,
            adAccountId: reportConfig.metaAdAccountId!,
            startDate,
            endDate,
          }),
      });
    }
  }

  for (const { source, fn } of sourcesToFetch) {
    try {
      const data = await fn();
      await db.metric.upsert({
        where: {
          clientId_source_period: { clientId, source, period },
        },
        create: { clientId, agencyId, source, period, data },
        update: { data, fetchedAt: new Date() },
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : String(err);
      if (code === "GA_RATE_LIMIT" || code === "GSC_RATE_LIMIT" || code === "META_RATE_LIMIT") {
        throw err;
      }
    }
  }
}
