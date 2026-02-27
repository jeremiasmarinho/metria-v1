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

export type IngestSourceReason =
  | "GA_AUTH_401"
  | "GA_AUTH_403"
  | "GSC_AUTH_401"
  | "GSC_AUTH_403"
  | "META_AUTH_401"
  | "META_AUTH_403"
  | "META_TOKEN_EXPIRED"
  | "GOOGLE_TOKEN_REFRESH_FAILED"
  | "UNKNOWN";

export interface IngestSourceResult {
  source: MetricSource;
  status: "success" | "error";
  reason?: IngestSourceReason;
}

export interface IngestResult {
  results: IngestSourceResult[];
  successfulSources: MetricSource[];
  failedSources: Array<{ source: MetricSource; reason: IngestSourceReason }>;
}

function mapSourceReason(err: unknown): IngestSourceReason | null {
  if (!(err instanceof Error)) return null;
  const msg = err.message;
  if (msg === "GA_AUTH_401") return "GA_AUTH_401";
  if (msg === "GA_AUTH_403") return "GA_AUTH_403";
  if (msg === "GSC_AUTH_401") return "GSC_AUTH_401";
  if (msg === "GSC_AUTH_403") return "GSC_AUTH_403";
  if (msg === "META_AUTH_401") return "META_AUTH_401";
  if (msg === "META_AUTH_403") return "META_AUTH_403";
  if (msg === "META_TOKEN_EXPIRED") return "META_TOKEN_EXPIRED";
  if (msg.startsWith("Google token refresh failed:")) return "GOOGLE_TOKEN_REFRESH_FAILED";
  return null;
}

export async function ingestClientMetrics(
  clientId: string,
  agencyId: string,
  period: Date
): Promise<IngestResult> {
  const client = await db.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const integrations = client.integrations as unknown as ClientIntegrations;
  const { start: startDate, end: endDate } = getMonthRange(period);

  const sourcesToFetch: Array<{ source: MetricSource; fn: () => Promise<object> }> = [];
  const results: IngestSourceResult[] = [];

  if (integrations.google?.accessToken && integrations.google?.refreshToken) {
    try {
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
    } catch (err) {
      const reason = mapSourceReason(err) ?? "GOOGLE_TOKEN_REFRESH_FAILED";
      results.push({ source: "GOOGLE_ANALYTICS", status: "error", reason });
      results.push({ source: "GOOGLE_SEARCH_CONSOLE", status: "error", reason });
    }
  }

  if (integrations.meta?.accessToken) {
    try {
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
    } catch (err) {
      const reason = mapSourceReason(err) ?? "UNKNOWN";
      results.push({ source: "META_ADS", status: "error", reason });
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
      results.push({ source, status: "success" });
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
      const reason = mapSourceReason(err);
      if (reason) {
        results.push({ source, status: "error", reason });
        continue;
      }
      results.push({ source, status: "error", reason: "UNKNOWN" });
      console.error(`[ingest] Error fetching ${source}:`, err);
    }
  }

  const successfulSources = results
    .filter((r): r is IngestSourceResult & { status: "success" } => r.status === "success")
    .map((r) => r.source);
  const failedSources = results
    .filter((r): r is IngestSourceResult & { status: "error"; reason: IngestSourceReason } =>
      r.status === "error" && Boolean(r.reason)
    )
    .map((r) => ({ source: r.source, reason: r.reason }));

  return { results, successfulSources, failedSources };
}
