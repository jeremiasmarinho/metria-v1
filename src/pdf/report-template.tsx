import React from "react";
import { Document, Page } from "@react-pdf/renderer";
import type { ProcessedMetrics } from "@/types/integrations";
import { PdfHeader } from "./components/header";
import { MetricsTable } from "./components/metrics-table";
import { ExecutiveSummary } from "./components/executive-summary";
import { ChartImage } from "./components/chart-image";
import { styles } from "./styles";

interface ReportTemplateProps {
  clientName: string;
  period: string;
  processed: ProcessedMetrics;
  aiAnalysis: string;
  chartImages?: string[];
}

export function ReportTemplate({
  clientName,
  period,
  processed,
  aiAnalysis,
  chartImages = [],
}: ReportTemplateProps) {
  const rows: Array<{ label: string; value: string | number; variation?: number }> = [];

  if (processed.googleAnalytics) {
    const ga = processed.googleAnalytics;
    rows.push(
      { label: "Usuários (GA4)", value: ga.users ?? 0, variation: ga.variation?.users },
      { label: "Sessões", value: ga.sessions ?? 0, variation: ga.variation?.sessions },
      { label: "Pageviews", value: ga.pageviews ?? 0, variation: ga.variation?.pageviews },
      { label: "Taxa de rejeição", value: `${ga.bounceRate ?? 0}%` },
      { label: "Conversões", value: ga.conversions ?? 0 }
    );
  }
  if (processed.searchConsole) {
    const sc = processed.searchConsole;
    rows.push(
      {
        label: "Cliques (GSC)",
        value: sc.totalClicks ?? 0,
        variation: sc.variation?.totalClicks,
      },
      {
        label: "Impressões",
        value: sc.totalImpressions ?? 0,
        variation: sc.variation?.totalImpressions,
      }
    );
  }
  if (processed.metaAds) {
    const ma = processed.metaAds;
    rows.push(
      { label: "Investimento (Meta)", value: `R$ ${ma.spend ?? 0}`, variation: ma.variation?.spend },
      { label: "Alcance", value: ma.reach ?? 0, variation: ma.variation?.reach },
      { label: "Conversões", value: ma.conversions ?? 0, variation: ma.variation?.conversions }
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader clientName={clientName} period={period} />
        <ExecutiveSummary content={aiAnalysis} />
        {chartImages.map((src, i) => (
          <ChartImage key={i} src={src} />
        ))}
        {rows.length > 0 && (
          <MetricsTable rows={rows} />
        )}
      </Page>
    </Document>
  );
}
