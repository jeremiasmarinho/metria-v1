import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkZApiHealth, sendWhatsAppMessage } from "@/lib/integrations/z-api";

describe("z-api integration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.ZAPI_INSTANCE_ID = "instance-1";
    process.env.ZAPI_TOKEN = "token-1";
    process.env.ZAPI_SECURITY_TOKEN = "sec-1";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns false in healthcheck when API body has error", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ error: "NOT_FOUND", message: "invalid route" }),
    } as Response);

    const healthy = await checkZApiHealth();

    expect(healthy).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.z-api.io/instances/instance-1/token/token-1/status",
      { headers: { "Client-Token": "sec-1" } }
    );
  });

  it("sends document message using send-document/pdf endpoint", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ok" }),
    } as Response);

    await sendWhatsAppMessage(
      "+55 (63) 99236-1046",
      "Legenda do relatório",
      "https://signed/report.pdf"
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.z-api.io/instances/instance-1/token/token-1/send-document/pdf");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({
      "Client-Token": "sec-1",
      "Content-Type": "application/json",
    });
    expect(options.body).toBe(
      JSON.stringify({
        phone: "5563992361046",
        document: "https://signed/report.pdf",
        fileName: "Relatorio_Metria.pdf",
        caption: "Legenda do relatório",
      })
    );
  });

  it("throws when z-api returns logical error with HTTP 200", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ error: "NOT_FOUND", message: "Unable to find matching target resource method" }),
    } as Response);

    await expect(
      sendWhatsAppMessage("5563992361046", "teste", "https://signed/report.pdf")
    ).rejects.toThrow("Z-API error: NOT_FOUND Unable to find matching target resource method");
  });
});
