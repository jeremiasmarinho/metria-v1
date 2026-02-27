import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    report: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/inngest/client", () => ({
  inngest: {
    send: vi.fn(),
  },
}));

import { POST } from "@/app/api/reports/[id]/generate/route";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";

describe("POST /api/reports/[id]/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 500 when AGENCY_ID is not configured", async () => {
    const previous = process.env.AGENCY_ID;
    delete process.env.AGENCY_ID;

    const res = await POST(new Request("http://localhost/api/reports/x/generate"), {
      params: Promise.resolve({ id: "r1" }),
    });

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "AGENCY_ID not configured" });

    process.env.AGENCY_ID = previous;
  });

  it("returns 404 when report is not found", async () => {
    process.env.AGENCY_ID = "agency-1";
    vi.mocked(db.report.findUnique).mockResolvedValue(null);

    const res = await POST(new Request("http://localhost/api/reports/x/generate"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Report not found" });
    expect(inngest.send).not.toHaveBeenCalled();
  });

  it("enqueues generation event for valid report", async () => {
    process.env.AGENCY_ID = "agency-1";
    vi.mocked(db.report.findUnique).mockResolvedValue({
      id: "r-1",
      clientId: "c-1",
      period: new Date("2026-01-01T00:00:00.000Z"),
      client: { id: "c-1", name: "Cliente" },
    } as never);
    vi.mocked(inngest.send).mockResolvedValue(undefined as never);

    const res = await POST(new Request("http://localhost/api/reports/r-1/generate"), {
      params: Promise.resolve({ id: "r-1" }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      message: "Report generation triggered",
      reportId: "r-1",
    });
    expect(inngest.send).toHaveBeenCalledWith({
      name: "metria/generate-report",
      data: {
        reportId: "r-1",
        clientId: "c-1",
        period: "2026-01-01T00:00:00.000Z",
      },
    });
  });
});
