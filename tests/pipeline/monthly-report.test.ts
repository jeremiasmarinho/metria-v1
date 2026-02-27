import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    client: {
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    report: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/pipeline/ingest", () => ({
  ingestClientMetrics: vi.fn(),
}));

vi.mock("@/lib/pipeline/process", () => ({
  processClientMetrics: vi.fn(),
}));

vi.mock("@/lib/pipeline/analyze", () => ({
  analyzeMetrics: vi.fn(),
}));

vi.mock("@/lib/pipeline/compile-pdf", () => ({
  compileReportPdf: vi.fn(),
}));

vi.mock("@/lib/pipeline/store", () => ({
  storeReportPdf: vi.fn(),
}));

vi.mock("@/lib/pipeline/deliver", () => ({
  deliverReport: vi.fn(),
}));

import { db } from "@/lib/db";
import { ingestClientMetrics } from "@/lib/pipeline/ingest";
import { processClientMetrics } from "@/lib/pipeline/process";
import { analyzeMetrics } from "@/lib/pipeline/analyze";
import { compileReportPdf } from "@/lib/pipeline/compile-pdf";
import { storeReportPdf } from "@/lib/pipeline/store";
import { deliverReport } from "@/lib/pipeline/deliver";
import { monthlyReport } from "@/lib/inngest/monthly-report";

describe("monthly-report pipeline integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AGENCY_ID = "agency-test";

    vi.mocked(db.client.findMany).mockResolvedValue([{ id: "client-1" }] as never);
    vi.mocked(db.client.findUniqueOrThrow).mockResolvedValue({
      id: "client-1",
      name: "Cliente Teste",
      email: "cliente@example.com",
      phone: "5563992361046",
    } as never);
    vi.mocked(db.report.upsert).mockResolvedValue({
      id: "report-1",
      clientId: "client-1",
    } as never);
    vi.mocked(db.report.update).mockResolvedValue({} as never);

    vi.mocked(ingestClientMetrics).mockResolvedValue({
      results: [{ source: "GOOGLE_ANALYTICS", status: "success" }],
      successfulSources: ["GOOGLE_ANALYTICS"],
      failedSources: [],
    } as never);
    vi.mocked(processClientMetrics).mockResolvedValue({
      googleAnalytics: null,
      googleSearchConsole: null,
      metaAds: null,
    } as never);
    vi.mocked(analyzeMetrics).mockResolvedValue("Resumo executivo" as never);
    vi.mocked(compileReportPdf).mockResolvedValue(Buffer.from("pdf") as never);
    vi.mocked(storeReportPdf).mockResolvedValue("https://signed/report.pdf" as never);
    vi.mocked(deliverReport).mockResolvedValue({
      whatsAppSent: true,
      emailSent: true,
    } as never);
  });

  it("happy path: transitions status from INGESTING to COMPLETED in order", async () => {
    const step = {
      run: vi.fn(async (_id: string, fn: () => Promise<unknown>) => fn()),
    };

    await monthlyReport.fn({ step } as never);

    expect(step.run).toHaveBeenCalledTimes(1);
    const callsWithStatus = vi
      .mocked(db.report.update)
      .mock.calls.map(([arg]) => arg.data?.status)
      .filter(Boolean);

    expect(callsWithStatus).toEqual(
      expect.arrayContaining([
        "INGESTING",
        "PROCESSING",
        "ANALYZING",
        "STORING",
        "DELIVERING",
        "COMPLETED",
      ])
    );

    expect(callsWithStatus[0]).toBe("INGESTING");
    expect(callsWithStatus[callsWithStatus.length - 1]).toBe("COMPLETED");
    expect(callsWithStatus).not.toContain("FAILED");
  });

  it("critical path: analyze failure marks report as FAILED with errorMessage", async () => {
    const analyzeError = new Error("OpenAI timeout");
    vi.mocked(analyzeMetrics).mockRejectedValue(analyzeError as never);
    const step = {
      run: vi.fn(async (_id: string, fn: () => Promise<unknown>) => fn()),
    };

    await expect(monthlyReport.fn({ step } as never)).rejects.toThrow("OpenAI timeout");

    const failedUpdate = vi.mocked(db.report.update).mock.calls.find(
      ([arg]) => arg.data?.status === "FAILED"
    );

    expect(failedUpdate).toBeDefined();
    expect(failedUpdate?.[0].data).toMatchObject({
      status: "FAILED",
      errorMessage: "OpenAI timeout",
    });
  });

  it("graceful degradation: marks report as PARTIAL when Google fails but Meta succeeds", async () => {
    vi.mocked(ingestClientMetrics).mockResolvedValue({
      results: [
        { source: "GOOGLE_ANALYTICS", status: "error", reason: "GA_AUTH_403" },
        { source: "META_ADS", status: "success" },
      ],
      successfulSources: ["META_ADS"],
      failedSources: [{ source: "GOOGLE_ANALYTICS", reason: "GA_AUTH_403" }],
    } as never);

    const step = {
      run: vi.fn(async (_id: string, fn: () => Promise<unknown>) => fn()),
    };

    await expect(monthlyReport.fn({ step } as never)).resolves.toEqual({ processed: 1 });

    const partialUpdate = vi.mocked(db.report.update).mock.calls.find(
      ([arg]) => arg.data?.status === "PARTIAL"
    );

    expect(partialUpdate).toBeDefined();
    expect(partialUpdate?.[0].data).toMatchObject({
      status: "PARTIAL",
      errorMessage: "PARTIAL_INGEST:GOOGLE_ANALYTICS:GA_AUTH_403",
    });
  });
});
