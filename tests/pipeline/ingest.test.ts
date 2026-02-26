import { describe, it, expect } from "vitest";

describe("ingest", () => {
  it("should export ingestClientMetrics", async () => {
    const mod = await import("@/lib/pipeline/ingest");
    expect(typeof mod.ingestClientMetrics).toBe("function");
  });
});
