import { uploadToR2, getSignedPdfUrl } from "@/lib/integrations/r2";

export async function storeReportPdf(
  clientId: string,
  period: string,
  buffer: Buffer
): Promise<string | null> {
  const key = `reports/${clientId}/${period.replace(/-/g, "")}/report.pdf`;
  const uploaded = await uploadToR2(key, buffer);
  if (!uploaded) return null;
  const signedUrl = await getSignedPdfUrl(uploaded);
  return signedUrl;
}
