import { describe, it, expect } from "vitest";

describe("process", () => {
  it("should export processClientMetrics", async () => {
    const mod = await import("@/lib/pipeline/process");
    expect(typeof mod.processClientMetrics).toBe("function");
  });
});
