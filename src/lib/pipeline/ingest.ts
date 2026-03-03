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
import { OAuthProvider } from "@prisma/client";
import { markAgencyConnectionDisconnected } from "@/lib/agency-connection";

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
  | "META_TOKEN_INVALID"
  | "GOOGLE_TOKEN_REFRESH_FAILED"
  | "GOOGLE_TOKEN_INVALID"
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
  if (msg === "META_TOKEN_INVALID") return "META_TOKEN_INVALID";
  if (msg === "GOOGLE_TOKEN_INVALID") return "GOOGLE_TOKEN_INVALID";
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

  const sourcesToFetch: Array<{
    source: MetricSource;
    fn: () => Promise<object>;
    onAuthError?: () => Promise<void>;
  }> = [];
  const results: IngestSourceResult[] = [];

  const reportConfigGoogle = client.reportConfig as {
    googlePropertyId?: string;
    googleSiteUrl?: string;
  };
  const hasGoogleConfig =
    reportConfigGoogle?.googlePropertyId || reportConfigGoogle?.googleSiteUrl;

  if (integrations.google?.accessToken && integrations.google?.refreshToken) {
    try {
      const decrypted = {
        accessToken: decrypt(integrations.google.accessToken),
        refreshToken: decrypt(integrations.google.refreshToken),
        expiresAt: integrations.google.expiresAt,
      };
      const fresh = await ensureFreshGoogleTokens(clientId, decrypted);

      if (reportConfigGoogle?.googlePropertyId) {
        sourcesToFetch.push({
          source: "GOOGLE_ANALYTICS",
          fn: () =>
            fetchGoogleAnalyticsMetrics({
              clientId,
              accessToken: fresh.accessToken,
              propertyId: reportConfigGoogle.googlePropertyId!,
              startDate,
              endDate,
            }),
        });
      }
      if (reportConfigGoogle?.googleSiteUrl) {
        sourcesToFetch.push({
          source: "GOOGLE_SEARCH_CONSOLE",
          fn: () =>
            fetchSearchConsoleMetrics({
              accessToken: fresh.accessToken,
              siteUrl: reportConfigGoogle.googleSiteUrl!,
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
  } else if (
    hasGoogleConfig &&
    client.googleAdsCustomerId &&
    !integrations.google?.accessToken
  ) {
    try {
      const agencyConn = await db.agencyConnection.findFirst({
        where: {
          agencyId,
          provider: OAuthProvider.GOOGLE,
          status: "CONNECTED",
        },
      });
      if (agencyConn?.accessToken && agencyConn?.refreshToken) {
        const decrypted = {
          accessToken: decrypt(agencyConn.accessToken),
          refreshToken: decrypt(agencyConn.refreshToken),
          expiresAt: agencyConn.expiresAt?.getTime() ?? 0,
        };
        const fresh = await ensureFreshGoogleTokens(clientId, decrypted, {
          persistToClient: false,
        });

        if (reportConfigGoogle?.googlePropertyId) {
          sourcesToFetch.push({
            source: "GOOGLE_ANALYTICS",
            fn: () =>
              fetchGoogleAnalyticsMetrics({
                clientId,
                accessToken: fresh.accessToken,
                propertyId: reportConfigGoogle.googlePropertyId!,
                startDate,
                endDate,
              }),
            onAuthError: () =>
              markAgencyConnectionDisconnected(agencyId, OAuthProvider.GOOGLE),
          });
        }
        if (reportConfigGoogle?.googleSiteUrl) {
          sourcesToFetch.push({
            source: "GOOGLE_SEARCH_CONSOLE",
            fn: () =>
              fetchSearchConsoleMetrics({
                accessToken: fresh.accessToken,
                siteUrl: reportConfigGoogle.googleSiteUrl!,
                startDate,
                endDate,
              }),
            onAuthError: () =>
              markAgencyConnectionDisconnected(agencyId, OAuthProvider.GOOGLE),
          });
        }
      }
    } catch (err) {
      const reason = mapSourceReason(err) ?? "GOOGLE_TOKEN_REFRESH_FAILED";
      results.push({ source: "GOOGLE_ANALYTICS", status: "error", reason });
      results.push({ source: "GOOGLE_SEARCH_CONSOLE", status: "error", reason });
    }
  }

  const metaAdAccountId =
    client.metaAdAccountId ??
    (client.reportConfig as { metaAdAccountId?: string })?.metaAdAccountId;

  if (metaAdAccountId) {
    try {
      let metaAccessToken: string | null = null;

      if (integrations.meta?.accessToken) {
        assertMetaTokenValid(integrations.meta.expiresAt);
        metaAccessToken = decrypt(integrations.meta.accessToken);
      } else {
        const agencyConn = await db.agencyConnection.findFirst({
          where: {
            agencyId,
            provider: OAuthProvider.META,
            status: "CONNECTED",
          },
        });
        if (agencyConn) {
          metaAccessToken = decrypt(agencyConn.accessToken);
        }
      }

      if (metaAccessToken) {
        const usedAgencyConnection = !integrations.meta?.accessToken;
        sourcesToFetch.push({
          source: "META_ADS",
          fn: () =>
            fetchMetaAdsMetrics({
              accessToken: metaAccessToken!,
              adAccountId: metaAdAccountId!,
              startDate,
              endDate,
            }),
          onAuthError: usedAgencyConnection
            ? () => markAgencyConnectionDisconnected(agencyId, OAuthProvider.META)
            : undefined,
        });
      }
    } catch (err) {
      const reason = mapSourceReason(err) ?? "UNKNOWN";
      results.push({ source: "META_ADS", status: "error", reason });
    }
  }

  const META_AUTH_ERRORS = ["META_AUTH_401", "META_AUTH_403", "META_TOKEN_INVALID"];
  const GOOGLE_AUTH_ERRORS = ["GOOGLE_TOKEN_INVALID", "GOOGLE_PERMISSION_DENIED"];

  for (const { source, fn, onAuthError } of sourcesToFetch) {
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
      const errMsg = err instanceof Error ? err.message : "";

      if (
        err instanceof Error &&
        (errMsg === "GA_RATE_LIMIT" ||
          errMsg === "GSC_RATE_LIMIT" ||
          errMsg === "META_RATE_LIMIT")
      ) {
        throw err;
      }
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue;
      }

      if (onAuthError) {
        const isAuthError =
          (source === "META_ADS" && META_AUTH_ERRORS.includes(errMsg)) ||
          ((source === "GOOGLE_ANALYTICS" || source === "GOOGLE_SEARCH_CONSOLE") &&
            (GOOGLE_AUTH_ERRORS.includes(errMsg) ||
              errMsg.includes("Google token refresh failed")));
        if (isAuthError) {
          await onAuthError();
        }
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
