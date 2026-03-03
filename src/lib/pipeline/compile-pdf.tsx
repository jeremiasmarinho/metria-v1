import React from "react";
import { renderToStream, Font } from "@react-pdf/renderer";
import { ReportTemplate } from "@/pdf/report-template";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-400-normal.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest/latin-700-normal.woff",
      fontWeight: 700,
    },
  ],
});
import type { ProcessedMetrics } from "@/types/integrations";

interface CompileOptions {
  clientName: string;
  period: string;
  processed: ProcessedMetrics;
  aiAnalysis: string;
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export type ChartSlot =
  | { type: "chart"; title: string; labels: string[]; data: number[] }
  | { type: "placeholder"; title: string };

function allZero(arr: number[]): boolean {
  return arr.length > 0 && arr.every((v) => v === 0);
}

export async function compileReportPdf(options: CompileOptions): Promise<Buffer> {
  const { clientName, period, processed, aiAnalysis } = options;
  const chartSlots: ChartSlot[] = [];

  if (processed.googleAnalytics) {
    const ga = processed.googleAnalytics;
    const labels = ["Usuários", "Sessões", "Pageviews", "Conversões"];
    const data = [
      ga.users ?? 0,
      ga.sessions ?? 0,
      ga.pageviews ?? 0,
      ga.conversions ?? 0,
    ];
    if (allZero(data)) {
      chartSlots.push({ type: "placeholder", title: "Métricas GA4" });
    } else {
      chartSlots.push({ type: "chart", title: "Métricas GA4", labels, data });
    }
  }

  if (processed.metaAds) {
    const ma = processed.metaAds;
    const labels = ["Alcance", "Impressões", "Cliques", "Conversões"];
    const data = [
      ma.reach ?? 0,
      ma.impressions ?? 0,
      ma.clicks ?? 0,
      ma.conversions ?? 0,
    ];
    if (allZero(data)) {
      chartSlots.push({ type: "placeholder", title: "Métricas Meta Ads" });
    } else {
      chartSlots.push({ type: "chart", title: "Métricas Meta Ads", labels, data });
    }
  }

  const doc = (
    <ReportTemplate
      clientName={clientName}
      period={period}
      processed={processed}
      aiAnalysis={aiAnalysis}
      chartSlots={chartSlots}
    />
  );
  const stream = await renderToStream(doc);
  return streamToBuffer(stream);
}
