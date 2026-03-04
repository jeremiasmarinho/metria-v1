export interface GoogleAnalyticsMetrics {
  users?: number;
  sessions?: number;
  pageviews?: number;
  bounceRate?: number;
  avgSessionDuration?: number;
  /**
   * Conversões GA4 agregadas (pode seguir a definição nativa ou ser alinhada aos eventos de conversão real).
   */
  conversions?: number;
  /**
   * Quebra tática por página + origem/mídia já consolidada a partir do GA4,
   * usada pelo motor de cálculo para gargalos.
   */
  pageBreakdown?: Array<{
    page: string;
    source: string;
    sessions: number;
    intents: number;
    conversions: number;
  }>;
  /**
   * Totais já consolidados de eventos de intenção e conversão real no GA4.
   */
  totalIntentEvents?: number;
  totalRealConversions?: number;
}

export interface SearchConsoleMetrics {
  queries: Array<{ query: string; clicks: number; impressions: number }>;
  totalClicks?: number;
  totalImpressions?: number;
}

export interface MetaAdsMetrics {
  spend?: number;
  reach?: number;
  impressions?: number;
  clicks?: number;
  /**
   * Conversões filtradas de acordo com metaConversionEvents.
   */
  conversions?: number;
}

export interface ProcessedMetrics {
  /**
   * Período no formato YYYY-MM.
   */
  period: string;

  /**
   * Blocos legados usados no PDF e em análises de variação.
   */
  googleAnalytics?: GoogleAnalyticsMetrics & { variation?: Record<string, number> };
  searchConsole?: SearchConsoleMetrics & { variation?: Record<string, number> };
  metaAds?: MetaAdsMetrics & { variation?: Record<string, number> };

  /**
   * Métricas cirúrgicas para o Modelo Oto (CPL + Diagnóstico).
   */
  totalSessoes?: number;
  totalUsuarios?: number;
  totalIntentEvents?: number;
  totalRealConversions?: number;
  totalMetaConversions?: number;
  investimentoTotal?: number;
  cplMeta?: number;
  cplReal?: number;

  /**
   * Quebra por página + origem para gargalos.
   */
  pageBreakdown?: Array<{
    page: string;
    source: string;
    sessions: number;
    intents: number;
    conversions: number;
  }>;
}
