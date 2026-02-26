import { describe, it, expect } from "vitest";

describe("analyze", () => {
  it("should export analyzeMetrics", async () => {
    const mod = await import("@/lib/pipeline/analyze");
    expect(typeof mod.analyzeMetrics).toBe("function");
  });
});
