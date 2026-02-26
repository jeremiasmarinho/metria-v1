import { checkZApiHealth, sendWhatsAppMessage } from "@/lib/integrations/z-api";
import { sendReportEmail } from "@/lib/integrations/email";

interface DeliverOptions {
  clientName: string;
  period: string;
  email?: string | null;
  phone?: string | null;
  pdfUrl: string | null;
}

export async function deliverReport(options: DeliverOptions): Promise<{
  whatsAppSent: boolean;
  emailSent: boolean;
}> {
  const { clientName, period, email, phone, pdfUrl } = options;

  let whatsAppSent = false;
  let emailSent = false;

  if (phone && pdfUrl) {
    const zApiHealthy = await checkZApiHealth();
    if (zApiHealthy) {
      try {
        const message = `Relatório de marketing - ${clientName} - ${period}:\n${pdfUrl}`;
        await sendWhatsAppMessage(phone, message, pdfUrl);
        whatsAppSent = true;
      } catch {
        // Log but don't fail - email is fallback
      }
    }
  }

  if (email && pdfUrl) {
    try {
      await sendReportEmail({ to: email, clientName, period, pdfUrl });
      emailSent = true;
    } catch (err) {
      throw err;
    }
  }

  return { whatsAppSent, emailSent };
}
