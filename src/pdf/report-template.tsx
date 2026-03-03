import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { ProcessedMetrics } from "@/types/integrations";
import type { ChartSlot } from "@/lib/pipeline/compile-pdf";
import { PdfHeader } from "./components/header";
import { MetricsTable } from "./components/metrics-table";
import { ExecutiveSummary } from "./components/executive-summary";
import { PdfBarChart } from "./components/pdf-bar-chart";
import { ChartPlaceholder } from "./components/chart-placeholder";
import { styles } from "./styles";
import { truncateText } from "./utils";

interface ReportTemplateProps {
  clientName: string;
  period: string;
  processed: ProcessedMetrics;
  aiAnalysis: string;
  chartSlots?: ChartSlot[];
}

export function ReportTemplate({
  clientName,
  period,
  processed,
  aiAnalysis,
  chartSlots = [],
}: ReportTemplateProps) {
  const googleRows: Array<{ label: string; value: string | number; variation?: number }> = [];
  const metaRows: Array<{ label: string; value: string | number; variation?: number }> = [];

  if (processed.googleAnalytics) {
    const ga = processed.googleAnalytics;
    googleRows.push(
      { label: "Usuários (GA4)", value: ga.users ?? 0, variation: ga.variation?.users },
      { label: "Sessões", value: ga.sessions ?? 0, variation: ga.variation?.sessions },
      { label: "Pageviews", value: ga.pageviews ?? 0, variation: ga.variation?.pageviews },
      { label: "Taxa de rejeição", value: `${ga.bounceRate ?? 0}%` },
      { label: "Conversões (GA4)", value: ga.conversions ?? 0 }
    );
  }
  if (processed.searchConsole) {
    const sc = processed.searchConsole;
    const topQueries = [...(sc.queries ?? [])]
      .sort((a, b) => (b.clicks ?? 0) - (a.clicks ?? 0))
      .slice(0, 5);
    const remainingQueries = (sc.queries ?? []).slice(5);
    const othersClicks = remainingQueries.reduce((sum, q) => sum + (q.clicks ?? 0), 0);

    googleRows.push(
      { label: "Cliques (GSC)", value: sc.totalClicks ?? 0, variation: sc.variation?.totalClicks },
      { label: "Impressões (GSC)", value: sc.totalImpressions ?? 0, variation: sc.variation?.totalImpressions }
    );

    topQueries.forEach((query, index) => {
      googleRows.push({
        label: `Top Query #${index + 1}: ${truncateText(query.query ?? "—", 40)}`,
        value: query.clicks ?? 0,
      });
    });

    if (remainingQueries.length > 0) {
      googleRows.push({ label: "Outros (queries)", value: othersClicks });
    }
  }

  if (processed.metaAds) {
    const ma = processed.metaAds;
    metaRows.push(
      { label: "Investimento", value: `R$ ${ma.spend ?? 0}`, variation: ma.variation?.spend },
      { label: "Alcance", value: ma.reach ?? 0, variation: ma.variation?.reach },
      { label: "Impressões", value: ma.impressions ?? 0 },
      { label: "Cliques", value: ma.clicks ?? 0 },
      { label: "Conversões", value: ma.conversions ?? 0, variation: ma.variation?.conversions }
    );
  }

  const hasGoogle = googleRows.length > 0;
  const hasMeta = metaRows.length > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader clientName={clientName} period={period} />
        <ExecutiveSummary content={aiAnalysis} />
        {chartSlots.map((slot, i) =>
          slot.type === "chart" ? (
            <PdfBarChart
              key={i}
              title={slot.title}
              labels={slot.labels}
              data={slot.data}
            />
          ) : (
            <ChartPlaceholder key={i} title={slot.title} />
          )
        )}

        {hasGoogle && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Google (Analytics + Search Console)</Text>
            <MetricsTable rows={googleRows} />
          </View>
        )}
        {hasMeta && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meta Ads</Text>
            <MetricsTable rows={metaRows} />
          </View>
        )}
        {!hasGoogle && !hasMeta && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Métricas</Text>
            <Text style={styles.text}>Sem dados registrados para este período.</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
