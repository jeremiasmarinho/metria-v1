import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { ReportTemplate } from "@/pdf/report-template";
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

function bufferToDataUri(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

export async function compileReportPdf(options: CompileOptions): Promise<Buffer> {
  const { clientName, period, processed, aiAnalysis } = options;
  const chartImages: string[] = [];

  try {
    const { generateBarChart } = await import("@/lib/charts");
    if (processed.googleAnalytics) {
      const ga = processed.googleAnalytics;
      const labels = ["Usuários", "Sessões", "Pageviews", "Conversões"];
      const data = [
        ga.users ?? 0,
        ga.sessions ?? 0,
        ga.pageviews ?? 0,
        ga.conversions ?? 0,
      ];
      const chartBuffer = await generateBarChart({
        labels,
        datasets: [{ label: "Google Analytics", data }],
        title: "Métricas GA4",
      });
      chartImages.push(bufferToDataUri(chartBuffer));
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
      const chartBuffer = await generateBarChart({
        labels,
        datasets: [{ label: "Meta Ads", data }],
        title: "Métricas Meta Ads",
      });
      chartImages.push(bufferToDataUri(chartBuffer));
    }
  } catch (err) {
    console.warn(
      "[compile-pdf] Chart generation skipped (chartjs-node-canvas may need native libs):",
      err
    );
  }

  const doc = (
    <ReportTemplate
      clientName={clientName}
      period={period}
      processed={processed}
      aiAnalysis={aiAnalysis}
      chartImages={chartImages}
    />
  );
  const stream = await renderToStream(doc);
  return streamToBuffer(stream);
}
