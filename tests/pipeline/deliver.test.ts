import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/integrations/z-api", () => ({
  checkZApiHealth: vi.fn(),
  sendWhatsAppMessage: vi.fn(),
}));

vi.mock("@/lib/integrations/email", () => ({
  sendReportEmail: vi.fn(),
}));

import { deliverReport } from "@/lib/pipeline/deliver";
import { checkZApiHealth, sendWhatsAppMessage } from "@/lib/integrations/z-api";
import { sendReportEmail } from "@/lib/integrations/email";

describe("deliverReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends WhatsApp and email when both channels are available", async () => {
    vi.mocked(checkZApiHealth).mockResolvedValue(true);
    vi.mocked(sendWhatsAppMessage).mockResolvedValue(undefined);
    vi.mocked(sendReportEmail).mockResolvedValue(undefined);

    const result = await deliverReport({
      clientName: "Cliente Teste",
      period: "2026-01",
      email: "cliente@example.com",
      phone: "5563992361046",
      pdfUrl: "https://signed-url/report.pdf",
    });

    expect(result).toEqual({ whatsAppSent: true, emailSent: true });
    expect(sendWhatsAppMessage).toHaveBeenCalledWith(
      "5563992361046",
      "Olá! Segue o relatório de marketing da Cliente Teste referente a 2026-01.",
      "https://signed-url/report.pdf"
    );
    expect(sendReportEmail).toHaveBeenCalledTimes(1);
  });

  it("does not fail entire delivery if WhatsApp fails", async () => {
    vi.mocked(checkZApiHealth).mockResolvedValue(true);
    vi.mocked(sendWhatsAppMessage).mockRejectedValue(new Error("zapi down"));
    vi.mocked(sendReportEmail).mockResolvedValue(undefined);

    const result = await deliverReport({
      clientName: "Cliente Teste",
      period: "2026-01",
      email: "cliente@example.com",
      phone: "5563992361046",
      pdfUrl: "https://signed-url/report.pdf",
    });

    expect(result).toEqual({ whatsAppSent: false, emailSent: true });
    expect(sendReportEmail).toHaveBeenCalledTimes(1);
  });

  it("throws when email fails (no silent swallow)", async () => {
    vi.mocked(checkZApiHealth).mockResolvedValue(false);
    vi.mocked(sendReportEmail).mockRejectedValue(new Error("resend failed"));

    await expect(
      deliverReport({
        clientName: "Cliente Teste",
        period: "2026-01",
        email: "cliente@example.com",
        phone: "5563992361046",
        pdfUrl: "https://signed-url/report.pdf",
      })
    ).rejects.toThrow("resend failed");
  });
});
