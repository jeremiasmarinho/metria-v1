# METRIA V1 — Arquitetura Técnica Completa

> Motor de Automação B2B para geração e entrega de relatórios de marketing.
> Documento de referência para desenvolvimento. Toda implementação deve seguir este guia.

---

## 1. Visão Geral

**O que é**: Sistema interno de uma agência de marketing que, todo dia 02 do mês:

1. Extrai métricas de Google Analytics 4, Search Console e Meta Ads
2. Processa análise executiva via OpenAI (GPT-4o)
3. Gera um PDF nativo com dados + análise
4. Envia o PDF via WhatsApp (Z-API) e e-mail para cada cliente

**Restrições do projeto**:

- Desenvolvedor solo, 4h/dia
- MVP funcional em 30-45 dias úteis
- Ferramenta interna (não é SaaS aberto na V1)

---

## 2. Infraestrutura

```
┌─────────────────────────────────────────────────────┐
│                    INTERNET                          │
└──────────┬──────────────────────────────┬────────────┘
           │                              │
    ┌──────▼──────┐              ┌────────▼────────┐
    │   Coolify   │              │   Cloudflare    │
    │  (PaaS na   │              │   R2 (S3)       │
    │   VPS)      │              │   PDFs gerados  │
    │             │              └────────▲────────┘
    │  Next.js    │                       │
    │  Monólito   │───── upload ──────────┘
    │  + Inngest  │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   Neon DB   │
    │  PostgreSQL │
    │  Serverless │
    └─────────────┘
```

| Componente | Serviço | Motivo |
|---|---|---|
| Aplicação | VPS Ubuntu + Coolify | Sem timeout de Lambda; controle total |
| Banco de dados | Neon DB (PostgreSQL Serverless) | Backup automático, HA, separa storage de compute |
| Armazenamento | Cloudflare R2 | S3-compatible, zero egress cost |
| Orquestração | Inngest | Filas, retries, cron, concorrência — tudo gerenciado |
| DNS/CDN | Cloudflare (opcional) | Cache + proteção |

---

## 3. Stack de Desenvolvimento

| Camada | Tecnologia | Versão mínima |
|---|---|---|
| Framework | Next.js (App Router) | 14+ |
| Linguagem | TypeScript | 5+ |
| UI | Tailwind CSS + Shadcn UI | latest |
| ORM | Prisma Client | 5+ |
| Background Jobs | Inngest | latest |
| Geração de PDF | @react-pdf/renderer | latest |
| Gráficos no PDF | chartjs-node-canvas | latest |
| API de IA | OpenAI SDK (GPT-4o) | latest |
| WhatsApp | Z-API (REST) | — |
| E-mail | Resend ou Nodemailer | latest |
| Validação | Zod | latest |
| Testes | Vitest | latest |

---

## 4. Estrutura de Pastas

```
metria/
├── .env.example                  # Variáveis de ambiente (template)
├── .env.local                    # Variáveis locais (git-ignored)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── prisma/
│   ├── schema.prisma             # Modelagem completa
│   └── seed.ts                   # Dados iniciais (agency, clients de teste)
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard home
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx      # Lista de clientes
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Detalhe do cliente
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx      # Lista de relatórios
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Visualizar relatório
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── inngest/
│   │       │   └── route.ts      # Endpoint do Inngest
│   │       ├── clients/
│   │       │   └── route.ts      # CRUD clientes
│   │       ├── reports/
│   │       │   ├── route.ts      # CRUD relatórios
│   │       │   └── [id]/
│   │       │       └── generate/
│   │       │           └── route.ts  # Trigger manual de geração
│   │       └── webhooks/
│   │           └── route.ts      # Webhooks externos
│   │
│   ├── lib/                      # Lógica de negócio e utilitários
│   │   ├── db.ts                 # Instância Prisma (singleton)
│   │   ├── env.ts                # Validação de env vars com Zod
│   │   ├── constants.ts          # Constantes globais
│   │   │
│   │   ├── integrations/         # Conectores de APIs externas
│   │   │   ├── google-analytics.ts
│   │   │   ├── google-search-console.ts
│   │   │   ├── meta-ads.ts
│   │   │   ├── openai.ts
│   │   │   ├── z-api.ts
│   │   │   ├── email.ts
│   │   │   └── r2.ts             # Upload para Cloudflare R2
│   │   │
│   │   ├── pipeline/             # Pipeline do Dia 02
│   │   │   ├── ingest.ts         # Step 1: puxar dados das APIs
│   │   │   ├── process.ts        # Step 2: sanitizar + calcular variações
│   │   │   ├── analyze.ts        # Step 3: enviar para OpenAI
│   │   │   ├── compile-pdf.ts    # Step 4: gerar PDF com react-pdf
│   │   │   ├── store.ts          # Step 5: upload R2
│   │   │   └── deliver.ts        # Step 6: enviar WhatsApp + e-mail
│   │   │
│   │   ├── inngest/              # Definições de funções Inngest
│   │   │   ├── client.ts         # Inngest client instance
│   │   │   ├── monthly-report.ts # Função principal do Dia 02
│   │   │   └── functions.ts      # Export de todas as funções
│   │   │
│   │   ├── crypto.ts             # Encrypt/decrypt de tokens OAuth (AES-256-GCM)
│   │   └── utils.ts              # Helpers genéricos
│   │
│   ├── components/               # Componentes React (UI)
│   │   ├── ui/                   # Shadcn UI components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── shell.tsx
│   │   ├── clients/
│   │   │   ├── client-card.tsx
│   │   │   └── client-form.tsx
│   │   └── reports/
│   │       ├── report-card.tsx
│   │       └── report-status.tsx
│   │
│   ├── pdf/                      # Templates de PDF (react-pdf)
│   │   ├── report-template.tsx   # Layout principal do relatório
│   │   ├── components/
│   │   │   ├── header.tsx
│   │   │   ├── metrics-table.tsx
│   │   │   ├── chart-image.tsx
│   │   │   └── executive-summary.tsx
│   │   └── styles.ts             # Estilos do react-pdf
│   │
│   └── types/                    # Tipos TypeScript compartilhados
│       ├── client.ts
│       ├── metric.ts
│       ├── report.ts
│       └── integrations.ts
│
└── tests/
    ├── pipeline/
    │   ├── ingest.test.ts
    │   ├── process.test.ts
    │   └── analyze.test.ts
    └── integrations/
        ├── google-analytics.test.ts
        └── meta-ads.test.ts
```

---

## 5. Schema Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Agency {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users   User[]
  clients Client[]

  @@map("agencies")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      UserRole @default(ANALYST)
  agencyId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  agency Agency @relation(fields: [agencyId], references: [id])

  @@map("users")
}

enum UserRole {
  ADMIN
  ANALYST
}

model Client {
  id        String   @id @default(cuid())
  name      String
  slug      String
  active    Boolean  @default(true)
  phone     String?
  email     String?
  agencyId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // JSONB: tokens OAuth criptografados (AES-256-GCM)
  // Formato: { google: { accessToken, refreshToken, expiresAt }, meta: { ... } }
  integrations Json @default("{}")

  // JSONB: preferências de relatório do cliente
  // Formato: { logo?: string, primaryColor?: string, sections?: string[] }
  reportConfig Json @default("{}")

  agency  Agency   @relation(fields: [agencyId], references: [id])
  metrics Metric[]
  reports Report[]

  @@unique([agencyId, slug])
  @@map("clients")
}

model Metric {
  id         String       @id @default(cuid())
  clientId   String
  agencyId   String
  source     MetricSource
  period     DateTime     // Primeiro dia do mês de referência
  data       Json         // Dados brutos da API
  fetchedAt  DateTime     @default(now())

  client Client @relation(fields: [clientId], references: [id])

  // Idempotência: impede duplicação de métricas
  @@unique([clientId, source, period])
  @@index([agencyId])
  @@map("metrics")
}

enum MetricSource {
  GOOGLE_ANALYTICS
  GOOGLE_SEARCH_CONSOLE
  META_ADS
}

model Report {
  id           String       @id @default(cuid())
  clientId     String
  agencyId     String
  period       DateTime     // Mês de referência
  status       ReportStatus @default(PENDING)
  pdfUrl       String?      // URL no R2 (com expiração)
  aiAnalysis   String?      // Texto gerado pela OpenAI
  errorMessage String?      // Último erro (se houver)
  sentAt       DateTime?    // Quando foi enviado ao cliente
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  client Client @relation(fields: [clientId], references: [id])

  @@unique([clientId, period])
  @@index([agencyId])
  @@index([status])
  @@map("reports")
}

enum ReportStatus {
  PENDING
  INGESTING
  PROCESSING
  ANALYZING
  COMPILING
  STORING
  DELIVERING
  COMPLETED
  FAILED
  PARTIAL
}
```

---

## 6. Variáveis de Ambiente

```bash
# ── Banco de dados (Neon) ──
DATABASE_URL="postgresql://user:pass@host/metria?sslmode=require"
DIRECT_URL="postgresql://user:pass@host/metria?sslmode=require"

# ── App ──
NEXTAUTH_SECRET="gerar-com-openssl-rand-base64-32"
NEXTAUTH_URL="https://metria.seudominio.com"
AGENCY_ID="id-fixo-da-agencia-v1"

# ── Criptografia de tokens OAuth ──
ENCRYPTION_KEY="gerar-com-openssl-rand-hex-32"

# ── Google APIs ──
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ── Meta / Facebook ──
META_APP_ID=""
META_APP_SECRET=""

# ── OpenAI ──
OPENAI_API_KEY=""

# ── Cloudflare R2 ──
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="metria-reports"
R2_PUBLIC_URL=""

# ── Z-API (WhatsApp) ──
ZAPI_INSTANCE_ID=""
ZAPI_TOKEN=""
ZAPI_SECURITY_TOKEN=""

# ── E-mail (Resend) ──
RESEND_API_KEY=""
EMAIL_FROM="relatorios@seudominio.com"

# ── Inngest ──
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""
```

---

## 7. Pipeline do Dia 02 (Fluxo Detalhado)

```
 CRON (Inngest)
 Todo dia 02, 06:00 UTC
         │
         ▼
 ┌───────────────┐
 │  Buscar todos  │
 │  os clientes   │
 │  ativos        │
 │  (Client.active│
 │   = true)      │
 └───────┬───────┘
         │
         ▼  Para cada cliente (concurrency: 3)
 ┌───────────────────────────────────────────────┐
 │                                               │
 │  STEP 1: INGEST (ingest.ts)                   │
 │  ├─ GA4 API → métricas do mês anterior        │
 │  ├─ Search Console API → queries + clicks     │
 │  ├─ Meta Ads API → spend + reach + conversões │
 │  ├─ Salvar em Metric (upsert, idempotente)    │
 │  └─ Report.status = INGESTING                 │
 │                                               │
 │  STEP 2: PROCESS (process.ts)                 │
 │  ├─ Buscar métricas do mês atual e anterior   │
 │  ├─ Calcular variações percentuais            │
 │  ├─ Montar objeto limpo (ProcessedMetrics)    │
 │  └─ Report.status = PROCESSING                │
 │                                               │
 │  STEP 3: ANALYZE (analyze.ts)                 │
 │  ├─ Enviar ProcessedMetrics para GPT-4o       │
 │  ├─ Prompt estrito de sistema (ver abaixo)    │
 │  ├─ Timeout: 60s, max retries: 2             │
 │  ├─ Fallback: texto padrão se IA falhar       │
 │  ├─ Salvar aiAnalysis no Report               │
 │  └─ Report.status = ANALYZING                 │
 │                                               │
 │  STEP 4: COMPILE PDF (compile-pdf.ts)         │
 │  ├─ Gerar imagens de gráficos (chartjs)       │
 │  ├─ Renderizar react-pdf com dados + análise  │
 │  ├─ Gerar Buffer em memória                   │
 │  └─ Report.status = COMPILING                 │
 │                                               │
 │  STEP 5: STORE (store.ts)                     │
 │  ├─ Upload Buffer → Cloudflare R2             │
 │  ├─ Gerar URL com expiração (30 dias)         │
 │  ├─ Salvar pdfUrl no Report                   │
 │  └─ Report.status = STORING                   │
 │                                               │
 │  STEP 6: DELIVER (deliver.ts)                 │
 │  ├─ Health check Z-API (sessão ativa?)        │
 │  │   ├─ SIM → enviar PDF + resumo via WhatsApp│
 │  │   └─ NÃO → pular WhatsApp, alertar admin   │
 │  ├─ Enviar e-mail com link do PDF             │
 │  ├─ Report.status = COMPLETED                 │
 │  └─ Report.sentAt = now()                     │
 │                                               │
 │  ON ERROR (qualquer step):                    │
 │  ├─ Report.status = FAILED                    │
 │  ├─ Report.errorMessage = erro                │
 │  └─ Notificar admin (e-mail ou WhatsApp)      │
 │                                               │
 └───────────────────────────────────────────────┘
```

### Prompt do Sistema para OpenAI (Step 3)

```text
Você é um analista sênior de marketing digital.
Receba os dados de performance do mês e gere um Relatório Executivo em português brasileiro.

Regras:
- Máximo 4 parágrafos.
- Comece com o destaque positivo mais relevante.
- Aponte 1-2 pontos de atenção com sugestão de ação.
- Use números exatos (não arredonde demais).
- Tom profissional mas acessível (o leitor é dono de empresa, não técnico).
- NÃO invente dados. Use apenas o que foi fornecido.
```

---

## 8. Segurança

| Item | Abordagem |
|---|---|
| Tokens OAuth (Google/Meta) | Criptografados com AES-256-GCM na aplicação antes de salvar no JSONB. Chave em `ENCRYPTION_KEY` (env var). |
| Senhas de usuário | Hash com bcrypt (salt rounds: 12) |
| Autenticação | NextAuth.js com provider Credentials (V1) |
| Sessão | JWT com NEXTAUTH_SECRET |
| CORS | Restrito ao domínio da aplicação |
| Rate limiting | Middleware no Next.js (opcional V1) |
| Env vars | Nunca commitadas; `.env.local` no `.gitignore` |

### Utilitário de Criptografia (`src/lib/crypto.ts`)

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), encrypted.toString("hex"), tag.toString("hex")].join(":");
}

export function decrypt(payload: string): string {
  const [ivHex, encryptedHex, tagHex] = payload.split(":");
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(encryptedHex, "hex", "utf8") + decipher.final("utf8");
}
```

---

## 9. Tratamento de Erros e Fallbacks

| Cenário | Comportamento |
|---|---|
| API Google retorna 429 (rate limit) | Inngest `step.sleep()` com backoff exponencial. Max 3 retries. |
| API Meta retorna 429 | Mesmo tratamento. Concorrência limitada a 3 clientes simultâneos. |
| OpenAI timeout (>60s) ou erro | 2 retries. Se falhar, gera PDF sem análise de IA (placeholder). Report.status = PARTIAL. |
| Z-API sessão inativa | Pula WhatsApp, envia só e-mail. Alerta admin. |
| Prisma P2002 (duplicata) | Silencia o erro (métrica já existe, segue pipeline). |
| Erro em qualquer step | Report.status = FAILED, salva errorMessage, notifica admin. |
| VPS sem memória (PDF grande) | Processar 1 cliente por vez. Liberar buffer após upload. |

---

## 10. Cronograma de Sprints (4h/dia)

### Sprint 1 — Fundação (Dias 1-5, ~20h)

- [ ] Criar repositório Git + estrutura de pastas
- [ ] Setup Next.js 14 + TypeScript + Tailwind + Shadcn
- [ ] Configurar Prisma + conectar Neon DB
- [ ] Rodar migrations + seed (Agency + User + 2 Clients de teste)
- [ ] Setup Coolify na VPS + primeiro deploy
- [ ] Criar `src/lib/env.ts` (validação Zod das env vars)
- [ ] Criar `src/lib/db.ts` (singleton Prisma)
- [ ] Criar `src/lib/crypto.ts` (encrypt/decrypt)

### Sprint 2 — Integrações de Dados (Dias 6-12, ~28h)

- [ ] Implementar `integrations/google-analytics.ts`
- [ ] Implementar `integrations/google-search-console.ts`
- [ ] Implementar `integrations/meta-ads.ts`
- [ ] Testar cada integração isoladamente com dados reais
- [ ] Implementar `pipeline/ingest.ts` (orquestra as 3 integrações)
- [ ] Implementar `pipeline/process.ts` (sanitização + variações %)
- [ ] Escrever testes para ingest e process

### Sprint 3 — IA + PDF (Dias 13-18, ~24h)

- [ ] Implementar `integrations/openai.ts`
- [ ] Implementar `pipeline/analyze.ts` (com prompt + fallback)
- [ ] Criar template PDF (`src/pdf/report-template.tsx`)
- [ ] Implementar geração de gráficos (`chartjs-node-canvas`)
- [ ] Implementar `pipeline/compile-pdf.ts`
- [ ] Testar geração de PDF com dados mockados

### Sprint 4 — Entrega + Orquestração (Dias 19-25, ~28h)

- [ ] Implementar `integrations/r2.ts` (upload S3)
- [ ] Implementar `pipeline/store.ts`
- [ ] Implementar `integrations/z-api.ts` (com health check)
- [ ] Implementar `integrations/email.ts`
- [ ] Implementar `pipeline/deliver.ts`
- [ ] Setup Inngest (`client.ts` + `monthly-report.ts`)
- [ ] Configurar cron do Dia 02 no Inngest
- [ ] Testar pipeline completo end-to-end (1 cliente)

### Sprint 5 — Dashboard + Polish (Dias 26-32, ~28h)

- [ ] Layout base (sidebar, header, shell)
- [ ] Página de clientes (lista + formulário)
- [ ] Página de relatórios (lista + status + download)
- [ ] Página de settings (dados da agência)
- [ ] Autenticação (NextAuth + login)
- [ ] Botão "Gerar relatório manualmente" (trigger via API)

### Sprint 6 — Testes + Buffer (Dias 33-40, ~32h)

- [ ] Teste end-to-end com todos os clientes reais
- [ ] Simular falhas (API offline, timeout, sessão Z-API caída)
- [ ] Ajustar textos do prompt OpenAI com feedback real
- [ ] Revisar template PDF com feedback do cliente
- [ ] Monitoramento básico (logs no Coolify)
- [ ] Documentar .env.example e README

---

## 11. Dependências do package.json

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@prisma/client": "^5.0.0",
    "inngest": "latest",
    "@react-pdf/renderer": "latest",
    "chartjs-node-canvas": "latest",
    "chart.js": "latest",
    "openai": "latest",
    "@aws-sdk/client-s3": "latest",
    "@aws-sdk/s3-request-presigner": "latest",
    "next-auth": "latest",
    "bcryptjs": "latest",
    "resend": "latest",
    "zod": "latest",
    "tailwindcss": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "prisma": "^5.0.0",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/bcryptjs": "latest",
    "vitest": "latest",
    "autoprefixer": "latest",
    "postcss": "latest"
  }
}
```

---

## 12. Regras para o Composer / Agente de IA

Ao implementar qualquer parte deste projeto, siga estas regras:

1. **Siga a estrutura de pastas** exatamente como definida na seção 4.
2. **Use os nomes de arquivo** exatos listados aqui.
3. **Implemente um step do pipeline por vez** — nunca tudo de uma vez.
4. **Trate erros** em toda integração externa (Google, Meta, OpenAI, Z-API, R2).
5. **Use Zod** para validar inputs de API routes e dados externos.
6. **Tokens OAuth** devem ser criptografados com `crypto.ts` antes de salvar.
7. **Não invente env vars** — use apenas as listadas na seção 6.
8. **Prisma**: use `upsert` para métricas (idempotência). Trate P2002 silenciosamente.
9. **Inngest**: concorrência máxima de 3. Backoff exponencial em rate limits.
10. **PDF**: processe 1 cliente por vez. Libere buffers após upload.
11. **Testes**: escreva pelo menos 1 teste por módulo do pipeline.
12. **Commits**: mensagens em inglês, prefixo convencional (`feat:`, `fix:`, `chore:`).
