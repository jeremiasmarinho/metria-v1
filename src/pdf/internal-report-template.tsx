import React from "react";
import { Document, Page, View, Text } from "@react-pdf/renderer";
import type { ProcessedMetrics } from "@/types/integrations";
import type { ChartSlot } from "@/lib/pipeline/compile-pdf";
import { PdfBarChart } from "./components/pdf-bar-chart";
import { ChartPlaceholder } from "./components/chart-placeholder";
import { MetricsTable } from "./components/metrics-table";
import { styles } from "./styles";

interface InternalReportTemplateProps {
  clientName: string;
  period: string;
  processed: ProcessedMetrics;
  aiAnalysisInternal: string;
  chartSlots: ChartSlot[];
}

export function InternalReportTemplate({
  clientName,
  period,
  processed,
  aiAnalysisInternal,
  chartSlots,
}: InternalReportTemplateProps) {
  const totalSessoes =
    processed.totalSessoes ?? processed.googleAnalytics?.sessions ?? 0;
  const totalUsuarios =
    processed.totalUsuarios ?? processed.googleAnalytics?.users ?? 0;
  const totalIntentEvents =
    processed.totalIntentEvents ?? processed.googleAnalytics?.totalIntentEvents ?? 0;
  const totalRealConversions =
    processed.totalRealConversions ??
    processed.googleAnalytics?.totalRealConversions ??
    processed.googleAnalytics?.conversions ??
    0;
  const investimentoTotal =
    processed.investimentoTotal ?? processed.metaAds?.spend ?? 0;
  const cplReal =
    processed.cplReal && processed.cplReal > 0
      ? processed.cplReal
      : totalRealConversions > 0 && investimentoTotal > 0
        ? investimentoTotal / totalRealConversions
        : 0;

  const kpiRows: Array<{ label: string; value: string | number }> = [
    { label: "Investimento Total (Meta)", value: `R$ ${investimentoTotal.toFixed(2)}` },
    { label: "Sessões (GA4)", value: totalSessoes },
    { label: "Usuários (GA4)", value: totalUsuarios },
    { label: "Intenção (cliques WhatsApp)", value: totalIntentEvents },
    { label: "Conversões Reais (Leads)", value: totalRealConversions },
    {
      label: "CPL Real",
      value:
        totalRealConversions > 0 && investimentoTotal > 0
          ? `R$ ${cplReal.toFixed(2)}`
          : "—",
    },
  ];

  const periodFormatted = new Date(period + "-01")
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { marginBottom: 16 }]}>
          <Text style={[styles.title, { fontSize: 14 }]}>Visão da Agência (Uso Interno)</Text>
          <Text style={styles.subtitle}>
            {clientName} — {periodFormatted}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnóstico e Ações Recomendadas</Text>
          <Text style={styles.text}>{aiAnalysisInternal}</Text>
        </View>

        {chartSlots.map((slot, i) =>
          slot.type === "chart" ? (
            <PdfBarChart key={i} title={slot.title} labels={slot.labels} data={slot.data} />
          ) : (
            <ChartPlaceholder key={i} title={slot.title} />
          )
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KPIs Principais</Text>
          <MetricsTable rows={kpiRows.map((r) => ({ label: r.label, value: r.value }))} />
        </View>
      </Page>
    </Document>
  );
}
