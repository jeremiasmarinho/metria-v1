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

  const pdfResponse = await fetch(pdfUrl);
  if (!pdfResponse.ok) {
    throw new Error(`Failed to fetch report PDF: ${pdfResponse.status} ${await pdfResponse.text()}`);
  }

  const pdfArrayBuffer = await pdfResponse.arrayBuffer();
  const pdfBuffer = Buffer.from(pdfArrayBuffer);
  const safeClientName = clientName.replace(/[^\w-]+/g, "_");
  const safePeriod = period.replace(/[^\w-]+/g, "_");
  const filename = `Relatorio_${safeClientName}_${safePeriod}.pdf`;

  const from = process.env.EMAIL_FROM ?? "relatorios@metria.com";

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Relatório de Marketing - ${clientName} - ${period}`,
    html: `
      <p>Olá,</p>
      <p>Segue o relatório de marketing referente ao período ${period}.</p>
      <p>O relatório segue em anexo.</p>
      <p>Atenciosamente,<br/>Equipe Metria</p>
    `,
    attachments: [
      {
        filename,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}
