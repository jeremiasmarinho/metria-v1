export type MetricSource = "GOOGLE_ANALYTICS" | "GOOGLE_SEARCH_CONSOLE" | "META_ADS";

export interface RawMetricData {
  source: MetricSource;
  period: string;
  [key: string]: unknown;
}
