/**
 * Script de verificação de credenciais e integrações.
 * Executa: npm run verify-credentials
 * (usa .env.local via dotenv-cli)
 */
import { PrismaClient } from "@prisma/client";

type CheckResult = { ok: boolean; message: string; detail?: string };

async function checkDatabase(): Promise<CheckResult> {
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    const count = await prisma.agency.count();
    await prisma.$disconnect();
    return {
      ok: true,
      message: `Conexão OK. ${count} agência(s) no banco.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      message: "Falha na conexão com o banco de dados.",
      detail: msg,
    };
  }
}

async function checkMetaApi(): Promise<CheckResult> {
  const token = process.env.META_ADS_ACCESS_TOKEN ?? process.env.META_APP_ACCESS_TOKEN;
  if (!token) {
    return {
      ok: false,
      message: "META_ADS_ACCESS_TOKEN não configurado.",
    };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v25.0/me/adaccounts?fields=id,name&access_token=${token}&limit=5`
    );
    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        message: `API Meta retornou ${res.status}.`,
        detail: text.slice(0, 300),
      };
    }
    const data = (await res.json()) as { data?: unknown[] };
    const count = data.data?.length ?? 0;
    return {
      ok: true,
      message: `API Meta OK. ${count} conta(s) de anúncios encontrada(s).`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      message: "Erro ao conectar na API Meta.",
      detail: msg,
    };
  }
}

async function checkResend(): Promise<CheckResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { ok: true, message: "RESEND_API_KEY não configurado (opcional)." };
  }
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.status === 401) {
      return { ok: false, message: "Resend: token inválido ou expirado." };
    }
    if (!res.ok) {
      return {
        ok: false,
        message: `Resend retornou ${res.status}.`,
        detail: await res.text().then((t) => t.slice(0, 200)),
      };
    }
    return { ok: true, message: "Resend: token válido." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      message: "Resend: erro de conexão.",
      detail: msg,
    };
  }
}

async function checkR2(): Promise<CheckResult> {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return { ok: true, message: "R2 não configurado (opcional)." };
  }
  try {
    const { S3Client, HeadBucketCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
    const bucket = R2_BUCKET_NAME ?? "metria-reports";
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return { ok: true, message: `R2: bucket "${bucket}" acessível.` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      message: "R2: falha ao acessar o bucket.",
      detail: msg,
    };
  }
}

async function checkZApi(): Promise<CheckResult> {
  const { ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_SECURITY_TOKEN } = process.env;
  if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
    return { ok: true, message: "Z-API não configurado (opcional)." };
  }
  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/status`,
      {
        headers: ZAPI_SECURITY_TOKEN ? { "Client-Token": ZAPI_SECURITY_TOKEN } : {},
      }
    );
    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        message: `Z-API: API retornou ${res.status}.`,
        detail: text.slice(0, 200),
      };
    }
    const data = (await res.json()) as { connected?: boolean; smartphoneConnected?: boolean };
    if (data.connected === true || data.smartphoneConnected === true) {
      return { ok: true, message: "Z-API: instância conectada." };
    }
    return {
      ok: false,
      message: "Z-API: instância não conectada.",
      detail: "connected ou smartphoneConnected não estão true.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      message: "Z-API: erro de conexão.",
      detail: msg,
    };
  }
}

async function main() {
  console.log("\n=== Verificação de credenciais e integrações ===\n");

  const required = ["DATABASE_URL", "DIRECT_URL", "NEXTAUTH_SECRET", "AGENCY_ID", "ENCRYPTION_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.log("❌ Variáveis obrigatórias ausentes:");
    missing.forEach((k) => console.log(`   - ${k}`));
    process.exit(1);
  }
  console.log("✓ Variáveis de ambiente obrigatórias presentes\n");

  const checks: Array<{ name: string; fn: () => Promise<CheckResult> }> = [
    { name: "Banco de dados (Neon)", fn: checkDatabase },
    { name: "API Meta Ads", fn: checkMetaApi },
    { name: "Resend (e-mail)", fn: checkResend },
    { name: "Cloudflare R2", fn: checkR2 },
    { name: "Z-API (WhatsApp)", fn: checkZApi },
  ];

  let failed = 0;
  for (const { name, fn } of checks) {
    const r = await fn();
    const icon = r.ok ? "✓" : "✗";
    console.log(`${icon} ${name}: ${r.message}`);
    if (r.detail && !r.ok) console.log(`     ${r.detail}`);
    if (!r.ok) failed++;
  }

  console.log("\n=== Fim da verificação ===\n");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
