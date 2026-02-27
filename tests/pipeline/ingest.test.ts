import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    client: {
      findUniqueOrThrow: vi.fn(),
    },
    metric: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/crypto", () => ({
  decrypt: vi.fn(),
}));

vi.mock("@/lib/integrations/google-analytics", () => ({
  fetchGoogleAnalyticsMetrics: vi.fn(),
}));

vi.mock("@/lib/integrations/google-search-console", () => ({
  fetchSearchConsoleMetrics: vi.fn(),
}));

vi.mock("@/lib/integrations/meta-ads", () => ({
  fetchMetaAdsMetrics: vi.fn(),
}));

vi.mock("@/lib/integrations/oauth-refresh", () => ({
  ensureFreshGoogleTokens: vi.fn(),
  assertMetaTokenValid: vi.fn(),
}));

import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { ingestClientMetrics } from "@/lib/pipeline/ingest";
import { fetchGoogleAnalyticsMetrics } from "@/lib/integrations/google-analytics";
import { fetchMetaAdsMetrics } from "@/lib/integrations/meta-ads";
import { ensureFreshGoogleTokens, assertMetaTokenValid } from "@/lib/integrations/oauth-refresh";

describe("ingestClientMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gracefully degrades when Google returns 403 and Meta succeeds", async () => {
    vi.mocked(db.client.findUniqueOrThrow).mockResolvedValue({
      id: "client-1",
      integrations: {
        google: { accessToken: "enc-ga", refreshToken: "enc-gr", expiresAt: Date.now() + 60_000 },
        meta: { accessToken: "enc-meta", expiresAt: Date.now() + 60_000 },
      },
      reportConfig: {
        googlePropertyId: "123456",
        metaAdAccountId: "act_999",
      },
    } as never);

    vi.mocked(decrypt).mockImplementation((value: string) => value);
    vi.mocked(ensureFreshGoogleTokens).mockResolvedValue({
      accessToken: "ga-access",
      refreshToken: "ga-refresh",
      expiresAt: Date.now() + 60_000,
    } as never);
    vi.mocked(assertMetaTokenValid).mockReturnValue(undefined as never);

    vi.mocked(fetchGoogleAnalyticsMetrics).mockRejectedValue(new Error("GA_AUTH_403") as never);
    vi.mocked(fetchMetaAdsMetrics).mockResolvedValue({
      spend: 120.45,
      reach: 4200,
      impressions: 8500,
      clicks: 310,
      conversions: 17,
    } as never);
    vi.mocked(db.metric.upsert).mockResolvedValue({} as never);

    const result = await ingestClientMetrics("client-1", "agency-1", new Date("2026-01-01T00:00:00.000Z"));

    expect(result.successfulSources).toEqual(["META_ADS"]);
    expect(result.failedSources).toEqual([
      { source: "GOOGLE_ANALYTICS", reason: "GA_AUTH_403" },
    ]);
    expect(result.results).toEqual(
      expect.arrayContaining([
        { source: "GOOGLE_ANALYTICS", status: "error", reason: "GA_AUTH_403" },
        { source: "META_ADS", status: "success" },
      ])
    );
    expect(db.metric.upsert).toHaveBeenCalledTimes(1);
  });
});
