export interface GoogleAnalyticsMetrics {
  users?: number;
  sessions?: number;
  pageviews?: number;
  bounceRate?: number;
  avgSessionDuration?: number;
  conversions?: number;
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
  conversions?: number;
}

export interface ProcessedMetrics {
  period: string;
  googleAnalytics?: GoogleAnalyticsMetrics & { variation?: Record<string, number> };
  searchConsole?: SearchConsoleMetrics & { variation?: Record<string, number> };
  metaAds?: MetaAdsMetrics & { variation?: Record<string, number> };
}
