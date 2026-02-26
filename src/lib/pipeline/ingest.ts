import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import type { ClientIntegrations } from "@/types/client";
import { fetchGoogleAnalyticsMetrics } from "@/lib/integrations/google-analytics";
import { fetchSearchConsoleMetrics } from "@/lib/integrations/google-search-console";
import { fetchMetaAdsMetrics } from "@/lib/integrations/meta-ads";
import {
  ensureFreshGoogleTokens,
  assertMetaTokenValid,
} from "@/lib/integrations/oauth-refresh";
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

  if (integrations.google?.accessToken && integrations.google?.refreshToken) {
    const decrypted = {
      accessToken: decrypt(integrations.google.accessToken),
      refreshToken: decrypt(integrations.google.refreshToken),
      expiresAt: integrations.google.expiresAt,
    };
    const fresh = await ensureFreshGoogleTokens(clientId, decrypted);
    const reportConfig = client.reportConfig as {
      googlePropertyId?: string;
      googleSiteUrl?: string;
    };

    if (reportConfig?.googlePropertyId) {
      sourcesToFetch.push({
        source: "GOOGLE_ANALYTICS",
        fn: () =>
          fetchGoogleAnalyticsMetrics({
            clientId,
            accessToken: fresh.accessToken,
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
            accessToken: fresh.accessToken,
            siteUrl: reportConfig.googleSiteUrl!,
            startDate,
            endDate,
          }),
      });
    }
  }

  if (integrations.meta?.accessToken) {
    assertMetaTokenValid(integrations.meta.expiresAt);
    const decryptedMetaToken = decrypt(integrations.meta.accessToken);
    const reportConfig = client.reportConfig as { metaAdAccountId?: string };
    if (reportConfig?.metaAdAccountId) {
      sourcesToFetch.push({
        source: "META_ADS",
        fn: () =>
          fetchMetaAdsMetrics({
            accessToken: decryptedMetaToken,
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
      if (
        err instanceof Error &&
        (err.message === "GA_RATE_LIMIT" ||
          err.message === "GSC_RATE_LIMIT" ||
          err.message === "META_RATE_LIMIT")
      ) {
        throw err;
      }
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue;
      }
      console.error(`[ingest] Error fetching ${source}:`, err);
    }
  }
}
