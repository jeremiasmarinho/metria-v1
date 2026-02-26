# TAREFAS — Blindagem, Resiliência e Gráficos

> **Documento de execução para o Composer.**
> Toda alteração DEVE respeitar o ficheiro `ARCHITECTURE.md` na raiz do projeto.
> NÃO crie ficheiros que não existam na estrutura de pastas da secção 4 da arquitetura.
> NÃO invente variáveis de ambiente — use apenas as listadas na secção 6 da arquitetura.
> NÃO altere o schema Prisma (`prisma/schema.prisma`) — ele já está completo e correto.

---

## PASSO 1 — Blindar a Fundação (Segurança e Env)

### Tarefa 1.1 — Tornar variáveis obrigatórias no `src/lib/env.ts`

**Ficheiro:** `src/lib/env.ts`

**Problema atual:** Todas as 27 variáveis estão com `.optional()`. Se `ENCRYPTION_KEY` ou `DATABASE_URL` faltarem, o sistema arranca e falha em runtime no meio do pipeline.

**O que fazer:**

Alterar o schema Zod para que as variáveis críticas sejam **obrigatórias** (sem `.optional()`). As variáveis de integrações externas que dependem de cada cliente podem continuar opcionais.

Variáveis que DEVEM ser **obrigatórias** (remover o `.optional()`):

```
DATABASE_URL        → z.string().url()
DIRECT_URL          → z.string().url()
NEXTAUTH_SECRET     → z.string().min(32)
AGENCY_ID           → z.string().min(1)
ENCRYPTION_KEY      → z.string().length(64).regex(/^[a-f0-9]+$/i)
```

Variáveis que DEVEM continuar **opcionais** (manter `.optional()`):

```
NEXTAUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
META_APP_ID
META_APP_SECRET
OPENAI_API_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
ZAPI_INSTANCE_ID
ZAPI_TOKEN
ZAPI_SECURITY_TOKEN
RESEND_API_KEY
EMAIL_FROM
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
```

Alterar também a linha final do ficheiro. Atualmente é:

```typescript
export const env = process.env.DATABASE_URL ? validateEnv() : ({} as Env);
```

Substituir por:

```typescript
export const env = validateEnv();
```

**Justificação:** Se as variáveis obrigatórias faltarem, o sistema deve recusar-se a arrancar com uma mensagem clara. Não deve haver fallback silencioso.

**Restrição:** NÃO adicionar novas variáveis. Usar apenas as que já existem no ficheiro e que estão listadas na secção 6 do `ARCHITECTURE.md`.

---

### Tarefa 1.2 — Integrar `decrypt()` no `src/lib/pipeline/ingest.ts`

**Ficheiro:** `src/lib/pipeline/ingest.ts`

**Problema atual:** O campo `client.integrations` no banco de dados contém tokens OAuth que, segundo a secção 8 do `ARCHITECTURE.md`, DEVEM estar encriptados com AES-256-GCM usando `src/lib/crypto.ts`. Porém, o `ingest.ts` lê os tokens directamente sem desencriptar:

```typescript
// Linha 26 — lê o JSON cru do banco
const integrations = client.integrations as unknown as ClientIntegrations;

// Linha 33 — usa o token sem decrypt (ERRADO)
const accessToken = tokens.accessToken; // TODO: refresh if expired
```

**O que fazer:**

1. Adicionar o import de `decrypt` no topo do ficheiro:

```typescript
import { decrypt } from "@/lib/crypto";
```

2. Alterar a interface `ClientIntegrations` em `src/types/client.ts`. Os tokens no banco estão encriptados (são strings opacas no formato `iv:encrypted:tag`). A interface actual já está correcta para isso (são `string`). Não alterar a interface.

3. No `ingest.ts`, após ler `integrations`, desencriptar cada token antes de usar. A lógica deve ser:

```typescript
// Após a linha 26, desencriptar os tokens:
if (integrations.google?.accessToken) {
  const decryptedAccessToken = decrypt(integrations.google.accessToken);
  // usar decryptedAccessToken nas chamadas de GA4 e Search Console
}

if (integrations.meta?.accessToken) {
  const decryptedMetaToken = decrypt(integrations.meta.accessToken);
  // usar decryptedMetaToken na chamada de Meta Ads
}
```

4. Substituir TODAS as referências a `tokens.accessToken` e `meta.accessToken` pelas versões desencriptadas.

5. Remover o comentário `// TODO: refresh if expired` — isso será tratado na Tarefa 2.1.

**Restrição:** NÃO alterar a assinatura das funções em `google-analytics.ts`, `google-search-console.ts` ou `meta-ads.ts`. Elas recebem `accessToken: string` (texto plano) e isso está correcto — a desencriptação acontece no `ingest.ts` antes de chamar essas funções.

**Restrição:** NÃO alterar o `prisma/schema.prisma`. O campo `integrations Json` já suporta o formato encriptado.

---

### Tarefa 1.3 — Tratar erro Prisma P2002 no `ingest.ts`

**Ficheiro:** `src/lib/pipeline/ingest.ts`

**Problema actual:** O bloco `catch` nas linhas 89-94 só verifica rate limits. A secção 9 do `ARCHITECTURE.md` diz:

> Prisma P2002 (duplicata): Silencia o erro (métrica já existe, segue pipeline).

**O que fazer:** No bloco `catch` do `for` (linha 89), adicionar verificação para o código de erro P2002 do Prisma. Se for P2002, ignorar silenciosamente (a métrica já existe, o pipeline continua). Para outros erros que não sejam rate limit, logar mas não interromper o pipeline.

```typescript
import { Prisma } from "@prisma/client";

// No catch:
catch (err) {
  // Rate limits devem ser propagados para o Inngest tratar com backoff
  if (err instanceof Error && (
    err.message === "GA_RATE_LIMIT" ||
    err.message === "GSC_RATE_LIMIT" ||
    err.message === "META_RATE_LIMIT"
  )) {
    throw err;
  }
  // Prisma P2002 = duplicata, silenciar (métrica já existe)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    continue;
  }
  // Outros erros: logar mas não interromper o pipeline para as outras fontes
  console.error(`[ingest] Error fetching ${source}:`, err);
}
```

**Restrição:** O `upsert` já deveria evitar P2002, mas a arquitetura exige tratamento explícito como segurança extra. Manter o `upsert` E o tratamento P2002.

---

## PASSO 2 — Resiliência do Pipeline (Refresh e Retries)

### Tarefa 2.1 — Criar função de refresh de tokens OAuth

**Ficheiro a criar:** `src/lib/integrations/oauth-refresh.ts`

> **Nota:** Este ficheiro NÃO está listado explicitamente na secção 4 do `ARCHITECTURE.md`, mas está dentro de `src/lib/integrations/` que é o directório correcto para conectores de APIs externas. A necessidade de refresh é implícita na secção 8 (tokens OAuth) e no campo `expiresAt` da interface `ClientIntegrations`.

**O que fazer:**

1. Criar a função `refreshGoogleToken` que:
   - Recebe o `refreshToken` (já desencriptado) e as credenciais `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` do env
   - Faz POST para `https://oauth2.googleapis.com/token` com `grant_type=refresh_token`
   - Retorna o novo `accessToken` e `expiresAt`

2. Criar a função `ensureFreshTokens` que:
   - Recebe o `clientId` e os tokens desencriptados
   - Verifica se `expiresAt` é menor que `Date.now() + 300_000` (5 minutos de margem)
   - Se expirado: chama `refreshGoogleToken`, encripta os novos tokens com `encrypt()`, actualiza o campo `integrations` do Client no banco, e retorna os novos tokens
   - Se válido: retorna os tokens actuais sem alteração

3. Para Meta: tokens de longa duração do Meta Ads (60 dias) não precisam de refresh automático na V1. A função deve apenas verificar `expiresAt` e lançar erro se expirado, com mensagem clara pedindo re-autenticação manual.

**Estrutura do ficheiro:**

```typescript
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutos

export async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: number;
}> {
  // POST https://oauth2.googleapis.com/token
  // body: client_id, client_secret, refresh_token, grant_type=refresh_token
  // Usar GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET do process.env
  // Retornar { accessToken, expiresAt: Date.now() + expires_in * 1000 }
  // Em caso de erro, lançar Error com mensagem descritiva
}

export async function ensureFreshGoogleTokens(
  clientId: string,
  tokens: GoogleTokens
): Promise<GoogleTokens> {
  // Se tokens.expiresAt > Date.now() + buffer, retornar tokens actuais
  // Senão: chamar refreshGoogleToken(tokens.refreshToken)
  // Encriptar novos tokens com encrypt()
  // Actualizar client.integrations no banco com os tokens encriptados
  // Retornar os novos tokens (em texto plano, para uso imediato)
}

export function assertMetaTokenValid(expiresAt: number): void {
  // Se expiresAt < Date.now(), lançar Error:
  // "Meta Ads token expired. Re-authenticate manually."
}
```

**Restrição:** NÃO usar nenhuma lib OAuth externa. Usar `fetch` nativo para o endpoint do Google. As credenciais vêm de `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (já existem no env.ts).

---

### Tarefa 2.2 — Integrar refresh no `ingest.ts`

**Ficheiro:** `src/lib/pipeline/ingest.ts`

**O que fazer:** Após a desencriptação dos tokens (Tarefa 1.2), chamar `ensureFreshGoogleTokens` antes de usar os tokens do Google, e `assertMetaTokenValid` antes de usar o token do Meta.

A lógica no bloco do Google deve ficar:

```typescript
if (integrations.google?.accessToken) {
  const decrypted = {
    accessToken: decrypt(integrations.google.accessToken),
    refreshToken: decrypt(integrations.google.refreshToken),
    expiresAt: integrations.google.expiresAt,
  };
  const fresh = await ensureFreshGoogleTokens(clientId, decrypted);
  // usar fresh.accessToken nas chamadas de GA4 e Search Console
}
```

Para Meta:

```typescript
if (integrations.meta?.accessToken) {
  assertMetaTokenValid(integrations.meta.expiresAt);
  const decryptedMetaToken = decrypt(integrations.meta.accessToken);
  // usar decryptedMetaToken na chamada de Meta Ads
}
```

**Restrição:** NÃO alterar as funções `fetchGoogleAnalyticsMetrics`, `fetchSearchConsoleMetrics`, `fetchMetaAdsMetrics`. Elas continuam a receber `accessToken: string` em texto plano.

---

### Tarefa 2.3 — Implementar backoff exponencial no `monthly-report.ts`

**Ficheiro:** `src/lib/inngest/monthly-report.ts`

**Problema actual:** A secção 9 do `ARCHITECTURE.md` diz:

> API Google retorna 429 (rate limit): Inngest `step.sleep()` com backoff exponencial. Max 3 retries.
> API Meta retorna 429: Mesmo tratamento. Concorrência limitada a 3 clientes simultâneos.

Actualmente, o `monthly-report.ts` chama `runPipelineForClient` dentro de `step.run()` mas não trata rate limits com backoff. Se uma API retornar 429, o erro propaga e o Inngest faz retry simples (sem espera).

**O que fazer:**

Alterar a função `runPipelineForClient` para envolver a chamada de `ingestClientMetrics` num loop de retry com backoff. A lógica deve ser:

```typescript
// Dentro de runPipelineForClient, substituir:
//   await ingestClientMetrics(clientId, agencyId, period);
// Por:

const MAX_INGEST_RETRIES = 3;
const BASE_BACKOFF_MS = 10_000; // 10 segundos

for (let attempt = 0; attempt <= MAX_INGEST_RETRIES; attempt++) {
  try {
    await ingestClientMetrics(clientId, agencyId, period);
    break; // sucesso, sair do loop
  } catch (err) {
    const isRateLimit = err instanceof Error && (
      err.message === "GA_RATE_LIMIT" ||
      err.message === "GSC_RATE_LIMIT" ||
      err.message === "META_RATE_LIMIT"
    );
    if (isRateLimit && attempt < MAX_INGEST_RETRIES) {
      const waitMs = BASE_BACKOFF_MS * Math.pow(2, attempt); // 10s, 20s, 40s
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }
    throw err; // não é rate limit ou esgotou retries
  }
}
```

**Adicionar constantes ao `src/lib/constants.ts`:**

```typescript
export const MAX_INGEST_RETRIES = 3;
export const INGEST_BASE_BACKOFF_MS = 10_000;
```

**Restrição:** NÃO alterar o cron `"0 6 2 * *"`. NÃO alterar `MAX_CONCURRENT_CLIENTS = 3`. NÃO alterar `retries: 2` do Inngest (isso é retry do Inngest, diferente do backoff interno). A concorrência e o cron já estão correctos conforme a arquitectura.

**Restrição:** NÃO usar `step.sleep()` do Inngest para o backoff interno — usar `setTimeout` com `await` dentro do `step.run()`. O `step.sleep()` do Inngest é para pausas entre steps, não dentro de um step.

---

## PASSO 3 — Resolver a Dependência do Gráfico

### Tarefa 3.1 — Adicionar `chartjs-node-canvas` e `chart.js` ao projecto

**Ficheiro:** `package.json`

**Problema actual:** A secção 3 do `ARCHITECTURE.md` lista `chartjs-node-canvas` e `chart.js` como dependências obrigatórias. Foram removidos porque `chartjs-node-canvas` depende do pacote nativo `canvas` que requer libs do sistema (`libcairo2-dev`, `libpango1.0-dev`, etc.).

**O que fazer:**

1. Adicionar ao `dependencies` do `package.json`:

```json
"chartjs-node-canvas": "^4.1.6",
"chart.js": "^3.9.0"
```

> **ATENÇÃO:** `chartjs-node-canvas@4.x` requer `chart.js@^3.5.1` (peer dependency). NÃO usar `chart.js@^4.x` — causa conflito de peer deps.

2. Executar `npm install`. Se falhar com erro de `canvas` / `node-pre-gyp`, primeiro instalar as dependências do sistema:

```bash
sudo apt-get update && sudo apt-get install -y \
  build-essential \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  pkg-config \
  python3
```

Depois repetir `npm install`.

3. Actualizar `next.config.mjs` para incluir `chartjs-node-canvas` nos pacotes externos:

```javascript
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer", "chartjs-node-canvas"],
  },
};
```

**Restrição:** NÃO alterar nenhuma outra dependência do `package.json`. Apenas adicionar estas duas.

---

### Tarefa 3.2 — Criar o Dockerfile para deploy no Coolify

**Ficheiro a criar:** `Dockerfile` (raiz do projecto)

> **Nota:** O `ARCHITECTURE.md` menciona "VPS Ubuntu + Coolify" na secção 2. O Dockerfile é necessário para que o Coolify consiga fazer build com as dependências nativas do `canvas`.

**Conteúdo do Dockerfile:**

```dockerfile
FROM node:18-bookworm-slim AS base

# Instalar dependências nativas para chartjs-node-canvas
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
    python3 \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

**Actualizar `next.config.mjs`** para suportar standalone output (necessário para o Dockerfile):

```javascript
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer", "chartjs-node-canvas"],
  },
};
```

**Restrição:** NÃO adicionar `docker-compose.yml`. O Coolify gere o deploy. Apenas o Dockerfile é necessário.

---

### Tarefa 3.3 — Implementar geração de gráficos para o PDF

**Ficheiro:** `src/pdf/components/chart-image.tsx`

**Problema actual:** O componente existe mas apenas renderiza uma `<Image>` estática. Não há código que gere gráficos a partir dos dados.

**O que fazer:**

1. Criar um ficheiro utilitário `src/lib/charts.ts` (dentro de `src/lib/`, que é o directório para utilitários conforme a secção 4):

```typescript
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

const WIDTH = 600;
const HEIGHT = 300;

const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: WIDTH,
  height: HEIGHT,
  backgroundColour: "white",
});

export async function generateBarChart(options: {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
  }>;
  title?: string;
}): Promise<Buffer> {
  return chartJSNodeCanvas.renderToBuffer({
    type: "bar",
    data: {
      labels: options.labels,
      datasets: options.datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.backgroundColor ?? "rgba(59, 130, 246, 0.7)",
      })),
    },
    options: {
      plugins: {
        title: options.title ? { display: true, text: options.title } : undefined,
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}
```

2. Actualizar `src/lib/pipeline/compile-pdf.tsx` para gerar gráficos antes de renderizar o PDF:

   - Importar `generateBarChart` de `@/lib/charts`
   - Antes de chamar `renderToStream`, gerar os gráficos como Buffer PNG
   - Converter os buffers para data URIs (`data:image/png;base64,...`)
   - Passar as data URIs como props para o `ReportTemplate`

3. Actualizar `src/pdf/report-template.tsx` para aceitar uma prop opcional `chartImages: string[]` e renderizar cada uma usando o componente `ChartImage`.

4. O componente `src/pdf/components/chart-image.tsx` já está correcto — recebe `src: string` e renderiza `<Image>`. Não precisa de alteração.

**Restrição:** NÃO instalar outras libs de gráficos. Usar apenas `chartjs-node-canvas` + `chart.js` conforme a secção 3 do `ARCHITECTURE.md`.

**Restrição:** Processar 1 gráfico por vez e liberar o buffer após converter para base64, conforme a secção 9 do `ARCHITECTURE.md` ("VPS sem memória: Processar 1 cliente por vez. Liberar buffer após upload.").

---

## VERIFICAÇÃO FINAL

Após completar todas as tarefas, executar:

```bash
npm run build
npm run test
```

O build DEVE compilar sem erros de TypeScript.
Os testes DEVEM passar.

**NÃO alterar nenhum ficheiro que não esteja listado neste documento.**
**NÃO criar ficheiros fora da estrutura definida na secção 4 do `ARCHITECTURE.md`.**
**NÃO modificar o `prisma/schema.prisma`.**
