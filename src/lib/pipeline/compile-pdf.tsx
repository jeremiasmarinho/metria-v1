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

export async function compileReportPdf(options: CompileOptions): Promise<Buffer> {
  const { clientName, period, processed, aiAnalysis } = options;
  const doc = (
    <ReportTemplate
      clientName={clientName}
      period={period}
      processed={processed}
      aiAnalysis={aiAnalysis}
    />
  );
  const stream = await renderToStream(doc);
  return streamToBuffer(stream);
}
