import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendReportEmail(options: {
  to: string;
  clientName: string;
  period: string;
  pdfUrl: string;
}): Promise<void> {
  const { to, clientName, period, pdfUrl } = options;

  if (!resend) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const from = process.env.EMAIL_FROM ?? "relatorios@metria.com";

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Relatório de Marketing - ${clientName} - ${period}`,
    html: `
      <p>Olá,</p>
      <p>Segue o relatório de marketing referente ao período ${period}.</p>
      <p><a href="${pdfUrl}" target="_blank">Clique aqui para baixar o PDF</a></p>
      <p>O link expira em 30 dias.</p>
      <p>Atenciosamente,<br/>Equipe Metria</p>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}
