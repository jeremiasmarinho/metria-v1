import { describe, it, expect } from "vitest";

describe("google-analytics", () => {
  it("should export fetchGoogleAnalyticsMetrics", async () => {
    const mod = await import("@/lib/integrations/google-analytics");
    expect(typeof mod.fetchGoogleAnalyticsMetrics).toBe("function");
  });
});
