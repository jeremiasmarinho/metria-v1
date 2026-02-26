import { describe, it, expect } from "vitest";

describe("meta-ads", () => {
  it("should export fetchMetaAdsMetrics", async () => {
    const mod = await import("@/lib/integrations/meta-ads");
    expect(typeof mod.fetchMetaAdsMetrics).toBe("function");
  });
});
