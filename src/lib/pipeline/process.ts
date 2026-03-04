import { db } from "@/lib/db";
import type { ProcessedMetrics } from "@/types/integrations";
import type { MetricSource } from "@prisma/client";

export function calcVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

export async function processClientMetrics(
  clientId: string,
  period: Date
): Promise<ProcessedMetrics> {
  const prevPeriod = new Date(period.getFullYear(), period.getMonth() - 1, 1);

  const [currentMetrics, prevMetrics] = await Promise.all([
    db.metric.findMany({ where: { clientId, period } }),
    db.metric.findMany({ where: { clientId, period: prevPeriod } }),
  ]);

  const bySource = (
    rows: { source: MetricSource; data: unknown }[]
  ): Record<string, Record<string, number>> =>
    Object.fromEntries(
      rows.map((r) => [r.source, (r.data ?? {}) as Record<string, number>])
    );

  const curr = bySource(currentMetrics);
  const prev = bySource(prevMetrics);

  const result: ProcessedMetrics = {
    period: period.toISOString().slice(0, 7),
  };

  if (curr.GOOGLE_ANALYTICS || prev.GOOGLE_ANALYTICS) {
    const c = curr.GOOGLE_ANALYTICS ?? {};
    const p = prev.GOOGLE_ANALYTICS ?? {};
    result.googleAnalytics = {
      users: c.users ?? 0,
      sessions: c.sessions ?? 0,
      pageviews: c.pageviews ?? 0,
      bounceRate: c.bounceRate ?? 0,
      avgSessionDuration: c.avgSessionDuration ?? 0,
      conversions: c.conversions ?? 0,
      variation: {
        users: calcVariation(c.users ?? 0, p.users ?? 0),
        sessions: calcVariation(c.sessions ?? 0, p.sessions ?? 0),
        pageviews: calcVariation(c.pageviews ?? 0, p.pageviews ?? 0),
      },
    };
  }

  if (curr.GOOGLE_SEARCH_CONSOLE || prev.GOOGLE_SEARCH_CONSOLE) {
    const c = curr.GOOGLE_SEARCH_CONSOLE ?? {};
    const p = prev.GOOGLE_SEARCH_CONSOLE ?? {};
    const queries = c.queries as unknown;
    result.searchConsole = {
      queries: (Array.isArray(queries) ? queries : []) as Array<{
        query: string;
        clicks: number;
        impressions: number;
      }>,
      totalClicks: c.totalClicks ?? 0,
      totalImpressions: c.totalImpressions ?? 0,
      variation: {
        totalClicks: calcVariation(c.totalClicks ?? 0, p.totalClicks ?? 0),
        totalImpressions: calcVariation(c.totalImpressions ?? 0, p.totalImpressions ?? 0),
      },
    };
  }

  if (curr.META_ADS || prev.META_ADS) {
    const c = curr.META_ADS ?? {};
    const p = prev.META_ADS ?? {};
    result.metaAds = {
      spend: c.spend ?? 0,
      reach: c.reach ?? 0,
      impressions: c.impressions ?? 0,
      clicks: c.clicks ?? 0,
      conversions: c.conversions ?? 0,
      variation: {
        spend: calcVariation(c.spend ?? 0, p.spend ?? 0),
        reach: calcVariation(c.reach ?? 0, p.reach ?? 0),
        conversions: calcVariation(c.conversions ?? 0, p.conversions ?? 0),
      },
    };
  }

  // Métricas cirúrgicas (Modelo Oto): consolidação para IA e PDF
  const gaRaw = curr.GOOGLE_ANALYTICS as Record<string, unknown> | undefined;
  const totalSessoes = result.googleAnalytics?.sessions ?? 0;
  const totalUsuarios = result.googleAnalytics?.users ?? 0;
  const totalIntentEvents = (gaRaw?.totalIntentEvents as number | undefined) ?? 0;
  const totalRealConversions =
    (gaRaw?.totalRealConversions as number | undefined) ??
    result.googleAnalytics?.conversions ??
    0;
  const totalMetaConversions = result.metaAds?.conversions ?? 0;
  const investimentoTotal = result.metaAds?.spend ?? 0;
  const pageBreakdown: ProcessedMetrics["pageBreakdown"] = Array.isArray(gaRaw?.pageBreakdown)
    ? (gaRaw.pageBreakdown as ProcessedMetrics["pageBreakdown"])
    : [];

  result.totalSessoes = totalSessoes;
  result.totalUsuarios = totalUsuarios;
  result.totalIntentEvents = totalIntentEvents;
  result.totalRealConversions = totalRealConversions;
  result.totalMetaConversions = totalMetaConversions;
  result.investimentoTotal = investimentoTotal;
  result.cplMeta = totalMetaConversions > 0 ? investimentoTotal / totalMetaConversions : undefined;
  result.cplReal = totalRealConversions > 0 ? investimentoTotal / totalRealConversions : undefined;
  if (Array.isArray(pageBreakdown) && pageBreakdown.length > 0) {
    result.pageBreakdown = pageBreakdown;
  }

  if (result.googleAnalytics) {
    const ga = result.googleAnalytics as Record<string, unknown>;
    if (totalIntentEvents > 0) ga.totalIntentEvents = totalIntentEvents;
    if (totalRealConversions > 0) ga.totalRealConversions = totalRealConversions;
    if (Array.isArray(pageBreakdown) && pageBreakdown.length > 0) ga.pageBreakdown = pageBreakdown;
  }

  return result;
}
