import { inngest } from "./client";
import { db } from "@/lib/db";
import { ingestClientMetrics } from "@/lib/pipeline/ingest";
import { processClientMetrics } from "@/lib/pipeline/process";
import { analyzeMetrics } from "@/lib/pipeline/analyze";
import { compileReportPdf } from "@/lib/pipeline/compile-pdf";
import { storeReportPdf } from "@/lib/pipeline/store";
import { deliverReport } from "@/lib/pipeline/deliver";
import {
  MAX_CONCURRENT_CLIENTS,
  MAX_INGEST_RETRIES,
  INGEST_BASE_BACKOFF_MS,
} from "@/lib/constants";
import type { ReportStatus } from "@prisma/client";

async function runPipelineForClient(clientId: string, agencyId: string, period: Date) {
  const client = await db.client.findUniqueOrThrow({ where: { id: clientId } });

  const report = await db.report.upsert({
    where: { clientId_period: { clientId, period } },
    create: { clientId, agencyId, period, status: "PENDING" },
    update: { status: "PENDING" },
  });

  const updateStatus = async (status: ReportStatus, errorMessage?: string) => {
    await db.report.update({
      where: { id: report.id },
      data: { status, errorMessage: errorMessage ?? null },
    });
  };

  try {
    await updateStatus("INGESTING");
    for (let attempt = 0; attempt <= MAX_INGEST_RETRIES; attempt++) {
      try {
        await ingestClientMetrics(clientId, agencyId, period);
        break;
      } catch (err) {
        const isRateLimit =
          err instanceof Error &&
          (err.message === "GA_RATE_LIMIT" ||
            err.message === "GSC_RATE_LIMIT" ||
            err.message === "META_RATE_LIMIT");
        if (isRateLimit && attempt < MAX_INGEST_RETRIES) {
          const waitMs = INGEST_BASE_BACKOFF_MS * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
        throw err;
      }
    }

    await updateStatus("PROCESSING");
    const processed = await processClientMetrics(clientId, period);

    await updateStatus("ANALYZING");
    const aiAnalysis = await analyzeMetrics(processed);

    await updateStatus("COMPILING");
    const periodStr = period.toISOString().slice(0, 7);
    const buffer = await compileReportPdf({
      clientName: client.name,
      period: periodStr,
      processed,
      aiAnalysis,
    });

    await db.report.update({
      where: { id: report.id },
      data: { aiAnalysis },
    });

    await updateStatus("STORING");
    const pdfUrl = await storeReportPdf(clientId, periodStr, buffer);

    await db.report.update({
      where: { id: report.id },
      data: { pdfUrl },
    });

    await updateStatus("DELIVERING");
    await deliverReport({
      clientName: client.name,
      period: periodStr,
      email: client.email,
      phone: client.phone,
      pdfUrl,
    });

    await db.report.update({
      where: { id: report.id },
      data: { status: "COMPLETED", sentAt: new Date() },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateStatus("FAILED", msg);
    throw err;
  }
}

export const manualReport = inngest.createFunction(
  {
    id: "manual-report",
    retries: 2,
  },
  { event: "metria/generate-report" },
  async ({ event }) => {
    const { reportId, clientId, period: periodStr } = event.data as {
      reportId: string;
      clientId: string;
      period: string;
    };
    const agencyId = process.env.AGENCY_ID;
    if (!agencyId) throw new Error("AGENCY_ID not configured");
    const period = new Date(periodStr);
    await runPipelineForClient(clientId, agencyId, period);
    return { reportId };
  }
);

export const monthlyReport = inngest.createFunction(
  {
    id: "monthly-report",
    retries: 2,
    concurrency: { limit: MAX_CONCURRENT_CLIENTS },
  },
  { cron: "0 6 2 * *" },
  async ({ step }) => {
    const agencyId = process.env.AGENCY_ID;
    if (!agencyId) throw new Error("AGENCY_ID not configured");

    const now = new Date();
    const period = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const clients = await db.client.findMany({
      where: { agencyId, active: true },
      select: { id: true },
    });

    for (const { id } of clients) {
      await step.run(`report-${id}`, () =>
        runPipelineForClient(id, agencyId, period)
      );
    }

    return { processed: clients.length };
  }
);
