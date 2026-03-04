/**
 * Script de teste E2E: Ingest (Google + Meta) -> Process -> Analyze -> Compile -> Store -> Deliver (Email)
 * Ignora Z-API (WhatsApp). Usa .env.local via dotenv-cli.
 *
 * Execução: npm run test-e2e-pipeline
 * ou: npx dotenv -e .env.local -- npx tsx scripts/test-e2e-pipeline.ts
 */

import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { OAuthProvider } from "@prisma/client";
import { ingestClientMetrics } from "@/lib/pipeline/ingest";
import { processClientMetrics } from "@/lib/pipeline/process";
import { analyzeMetrics } from "@/lib/pipeline/analyze";
import { compileReportPdf } from "@/lib/pipeline/compile-pdf";
import { storeReportPdf } from "@/lib/pipeline/store";
import { deliverReport } from "@/lib/pipeline/deliver";
async function ensureMetaAgencyConnection(agencyId: string): Promise<void> {
  const existing = await db.agencyConnection.findFirst({
    where: { agencyId, provider: OAuthProvider.META, status: "CONNECTED" },
  });
  if (existing) {
    console.log("[E2E] Meta: AgencyConnection já existe (CONNECTED)");
    return;
  }

  const token = process.env.META_ADS_ACCESS_TOKEN;
  if (!token) {
    throw new Error("META_ADS_ACCESS_TOKEN não configurado. Necessário para Meta Ads no E2E.");
  }

  const user = await db.user.findFirst({ where: { agencyId } });
  if (!user) {
    throw new Error("Nenhum usuário encontrado na agência.");
  }

  const encryptedToken = encrypt(token);
  await db.agencyConnection.upsert({
    where: {
      agencyId_provider: { agencyId, provider: OAuthProvider.META },
    },
    create: {
      agencyId,
      provider: OAuthProvider.META,
      accessToken: encryptedToken,
      connectedBy: user.id,
      status: "CONNECTED",
    },
    update: {
      accessToken: encryptedToken,
      status: "CONNECTED",
      connectedBy: user.id,
    },
  });
  console.log("[E2E] Meta: AgencyConnection criada/atualizada com META_ADS_ACCESS_TOKEN");
}

async function ensureClientHasGoogleConfig(
  clientId: string,
  agencyId: string
): Promise<void> {
  const client = await db.client.findUniqueOrThrow({ where: { id: clientId } });

  const googleAdsCustomerId =
    process.env.GOOGLE_ADS_CUSTOMER_ID ??
    process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

  const reportConfig =
    typeof client.reportConfig === "object" && client.reportConfig !== null
      ? (client.reportConfig as Record<string, unknown>)
      : {};

  const updates: Record<string, unknown> = {};
  if (googleAdsCustomerId) {
    const normalized = googleAdsCustomerId.replace(/\D/g, "");
    const formatted =
      normalized.length >= 10
        ? `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`
        : normalized;
    updates.googleAdsCustomerId = formatted;
    updates.reportConfig = { ...reportConfig, googleAdsCustomerId: formatted };
  }

  if (Object.keys(updates).length > 0) {
    await db.client.update({
      where: { id: clientId },
      data: updates as Record<string, string | object>,
    });
    console.log("[E2E] Cliente atualizado com googleAdsCustomerId:", updates.googleAdsCustomerId ?? "—");
  }
}

async function ensureClientHasMetaAccount(
  clientId: string,
  agencyId: string
): Promise<string> {
  const client = await db.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const metaAdAccountId =
    client.metaAdAccountId ??
    (client.reportConfig as { metaAdAccountId?: string })?.metaAdAccountId;

  if (metaAdAccountId) {
    console.log("[E2E] Cliente já possui metaAdAccountId:", metaAdAccountId);
    return metaAdAccountId;
  }

  const token = process.env.META_ADS_ACCESS_TOKEN;
  if (!token) {
    throw new Error("META_ADS_ACCESS_TOKEN necessário para obter conta Meta do cliente.");
  }

  const res = await fetch(
    `https://graph.facebook.com/v25.0/me/adaccounts?fields=id,name&access_token=${token}&limit=5`
  );
  if (!res.ok) {
    throw new Error(`Meta API: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { data?: Array<{ id: string; name: string }> };
  const accounts = data.data ?? [];
  if (accounts.length === 0) {
    throw new Error("Nenhuma conta de anúncios Meta encontrada.");
  }

  const firstAccountId = accounts[0].id;
  await db.client.update({
    where: { id: clientId },
    data: {
      metaAdAccountId: firstAccountId,
      reportConfig: {
        ...(typeof client.reportConfig === "object" && client.reportConfig !== null
          ? (client.reportConfig as Record<string, unknown>)
          : {}),
        metaAdAccountId: firstAccountId,
      },
    },
  });
  console.log("[E2E] Cliente atualizado com metaAdAccountId:", firstAccountId);
  return firstAccountId;
}

async function main() {
  const agencyId = process.env.AGENCY_ID;
  if (!agencyId) {
    throw new Error("AGENCY_ID não configurado em .env.local");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn(
      "[E2E] ADMIN_EMAIL não definido. Adicione em .env.local para receber o relatório. Usando e-mail do cliente como fallback."
    );
  }

  console.log("\n=== Teste E2E Pipeline Metria (Google + Meta -> Email) ===\n");

  const client = await db.client.findFirst({
    where: { agencyId, active: true },
    orderBy: { createdAt: "asc" },
  });

  if (!client) {
    throw new Error("Nenhum cliente ativo encontrado. Rode db:seed primeiro.");
  }

  console.log("[E2E] Cliente selecionado:", client.name, "(", client.id, ")\n");

  await ensureMetaAgencyConnection(agencyId);
  await ensureClientHasGoogleConfig(client.id, agencyId);
  await ensureClientHasMetaAccount(client.id, agencyId);

  const now = new Date();
  const period = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const periodStr = period.toISOString().slice(0, 7);

  console.log("[E2E] Período:", periodStr, "\n");

  console.log("[E2E] Capturando Google Analytics / Search Console...");
  let ingestResult;
  try {
    ingestResult = await ingestClientMetrics(client.id, agencyId, period);
  } catch (err) {
    console.error("[E2E] Erro no Ingest:", err);
    throw err;
  }

  const successCount = ingestResult.successfulSources.length;
  const failCount = ingestResult.failedSources.length;
  console.log(
    `[E2E] Ingest concluído: ${successCount} fonte(s) OK, ${failCount} falha(s)`,
    ingestResult.successfulSources
  );
  if (failCount > 0) {
    console.log("      Falhas:", ingestResult.failedSources);
  }

  if (successCount === 0) {
    throw new Error("Ingest não retornou dados de nenhuma fonte. Verifique Meta/Google.");
  }

  console.log("\n[E2E] Processando métricas...");
  const processed = await processClientMetrics(client.id, period);
  console.log("[E2E] Processamento concluído. Métricas:", {
    googleAnalytics: !!processed.googleAnalytics,
    searchConsole: !!processed.searchConsole,
    metaAds: !!processed.metaAds,
  });

  console.log("\n[E2E] Analisando métricas (OpenAI)...");
  const analysisOutput = await analyzeMetrics(processed, client.name);
  const aiAnalysis = analysisOutput.clientReport.resumoExecutivo;
  console.log("[E2E] Análise concluída. Tamanho:", aiAnalysis.length, "caracteres");

  console.log("\n[E2E] Gerando PDF...");
  const buffer = await compileReportPdf({
    clientName: client.name,
    period: periodStr,
    processed,
    aiAnalysis,
  });
  console.log("[E2E] PDF gerado. Tamanho:", buffer.length, "bytes");

  console.log("\n[E2E] Enviando para R2...");
  const pdfUrl = await storeReportPdf(client.id, periodStr, buffer);
  if (!pdfUrl) {
    throw new Error("Falha ao armazenar PDF no R2.");
  }
  console.log("[E2E] PDF armazenado. URL obtida.");

  const deliverEmail = adminEmail ?? client.email;
  if (!deliverEmail) {
    throw new Error(
      "Nenhum e-mail de destino. Defina ADMIN_EMAIL em .env.local ou configure e-mail no cliente."
    );
  }

  console.log("\n[E2E] Enviando e-mail (Resend) para", deliverEmail, "(WhatsApp ignorado)...");
  const { emailSent } = await deliverReport({
    clientName: client.name,
    period: periodStr,
    email: deliverEmail,
    phone: null,
    pdfUrl,
  });

  if (emailSent) {
    console.log("[E2E] E-mail enviado com sucesso.");
  } else {
    throw new Error("Falha ao enviar e-mail.");
  }

  console.log("\n=== Teste E2E concluído com sucesso ===\n");
}

main()
  .catch((err) => {
    console.error("\n[E2E] ERRO:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
