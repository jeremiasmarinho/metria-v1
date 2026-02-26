# TAREFAS — Bloco A: Validação E2E (Choque de Realidade)

> **O momento de escrever features acabou. Agora é hora de ligar as credenciais reais e testar o pipeline de ponta a ponta.**
>
> NÃO escreva mais código de feature até o pipeline completo rodar com dados reais.
> Toda correcção deve ser cirúrgica — fix no ponto de falha, não refactoring.

---

## PASSO 0 — Gerar chaves locais

Antes de tudo, gerar as chaves que dependem apenas de você (não de serviços externos).

```bash
# NEXTAUTH_SECRET (32 bytes, base64)
openssl rand -base64 32

# ENCRYPTION_KEY (32 bytes, hex = 64 caracteres)
openssl rand -hex 32

# AGENCY_ID (qualquer string única — use um cuid ou uuid)
# Pode usar o ID que o seed vai gerar, ou gerar um fixo:
node -e "console.log(require('crypto').randomUUID())"
```

Preencher no `.env.local`:

```
NEXTAUTH_SECRET="<output do primeiro comando>"
ENCRYPTION_KEY="<output do segundo comando>"
AGENCY_ID="<output do terceiro comando, ou o cuid do seed>"
NEXTAUTH_URL="http://localhost:3000"
```

---

## PASSO 1 — Neon DB (PostgreSQL)

**Tempo estimado:** 10 minutos

1. Ir a https://neon.tech e criar conta (ou fazer login)
2. Criar um projecto (nome: `metria-v1`)
3. Copiar a **Connection String** (pooled) → `DATABASE_URL`
4. Copiar a **Direct Connection** → `DIRECT_URL`

Preencher no `.env.local`:

```
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

Depois executar:

```bash
npm run db:push
npm run db:seed
```

**Verificação:** O seed deve imprimir `Seed completed: Agency, User, 2 Clients`. Copiar o `id` da Agency impressa e usar como `AGENCY_ID` no `.env.local` (ou ajustar o seed para usar o UUID fixo que gerou no Passo 0).

---

## PASSO 2 — Google Cloud Console (OAuth + APIs)

**Tempo estimado:** 30 minutos

### 2.1 — Criar projecto e activar APIs

1. Ir a https://console.cloud.google.com
2. Criar um novo projecto (nome: `Metria`)
3. Ir a **APIs & Services > Library** e activar:
   - **Google Analytics Data API** (é a API v1beta do GA4, usada pelo `google-analytics.ts`)
   - **Google Search Console API** (usada pelo `google-search-console.ts`)

### 2.2 — Configurar tela de consentimento OAuth

1. Ir a **APIs & Services > OAuth consent screen**
2. Seleccionar **External** (ou Internal se for Google Workspace)
3. Preencher:
   - App name: `Metria`
   - User support email: o seu email
   - Developer contact: o seu email
4. Em **Scopes**, adicionar exactamente estes:

| Scope | Motivo | Usado em |
|---|---|---|
| `https://www.googleapis.com/auth/analytics.readonly` | Ler dados do GA4 | `google-analytics.ts` → `analyticsdata.googleapis.com/v1beta/properties/{id}:runReport` |
| `https://www.googleapis.com/auth/webmasters.readonly` | Ler dados do Search Console | `google-search-console.ts` → `googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query` |

5. Em **Test users**, adicionar o email da conta Google que tem acesso ao GA4 e Search Console do cliente.
6. Salvar.

### 2.3 — Criar credenciais OAuth

1. Ir a **APIs & Services > Credentials**
2. Clicar **Create Credentials > OAuth client ID**
3. Tipo: **Web application**
4. Nome: `Metria Web`
5. **Authorized redirect URIs**: adicionar `http://localhost:3000/api/auth/callback/google` (para desenvolvimento)
6. Copiar **Client ID** e **Client Secret**

Preencher no `.env.local`:

```
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxx"
```

### 2.4 — Obter tokens OAuth do cliente

**ATENÇÃO:** O sistema Metria não faz o fluxo OAuth no browser (não há botão "Conectar com Google"). Na V1, os tokens são inseridos manualmente na página de integrações do cliente.

Para obter o `access_token` e `refresh_token` pela primeira vez, usar o **OAuth 2.0 Playground** do Google:

1. Ir a https://developers.google.com/oauthplayground/
2. No canto superior direito, clicar na engrenagem (⚙️) e marcar **"Use your own OAuth credentials"**
3. Colar o `Client ID` e `Client Secret` que gerou
4. No painel esquerdo, seleccionar os scopes:
   - `Google Analytics Data API v1` → `https://www.googleapis.com/auth/analytics.readonly`
   - `Search Console API` → `https://www.googleapis.com/auth/webmasters.readonly`
5. Clicar **Authorize APIs** → fazer login com a conta que tem acesso ao GA4/GSC do cliente
6. Clicar **Exchange authorization code for tokens**
7. Copiar o `access_token` e o `refresh_token`

Estes tokens serão inseridos na página `/clients/[id]` (secção Integrações) após o login.

### 2.5 — Obter o Property ID do GA4

1. Ir a https://analytics.google.com
2. Ir a **Admin > Property Settings**
3. O **Property ID** é o número (ex: `123456789`)
4. No Metria, inserir como `properties/123456789` no campo "Property ID (GA4)"

### 2.6 — Obter o Site URL do Search Console

1. Ir a https://search.google.com/search-console
2. O site URL é o que aparece no selector (ex: `https://example.com` ou `sc-domain:example.com`)
3. Inserir exactamente como aparece no campo "Site URL (Search Console)"

---

## PASSO 3 — Meta for Developers (Facebook/Instagram Ads)

**Tempo estimado:** 20 minutos

### 3.1 — Criar app

1. Ir a https://developers.facebook.com
2. Clicar **My Apps > Create App**
3. Tipo: **Business**
4. Nome: `Metria`
5. Associar à Business Manager da agência (ou criar uma)

### 3.2 — Permissões necessárias

O `meta-ads.ts` chama:

```
GET https://graph.facebook.com/v18.0/act_{id}/insights?fields=spend,reach,impressions,clicks,actions
```

Para isto funcionar, o token precisa das seguintes permissões:

| Permissão | Motivo |
|---|---|
| `ads_read` | Ler dados de campanhas e insights |
| `read_insights` | Ler métricas de performance |

### 3.3 — Gerar token de acesso

**Opção A — Token de longa duração via Graph API Explorer (mais rápido para teste):**

1. Ir a https://developers.facebook.com/tools/explorer/
2. Seleccionar o app `Metria`
3. Em **Permissions**, adicionar: `ads_read`, `read_insights`
4. Clicar **Generate Access Token** → fazer login e autorizar
5. Este token dura ~2 horas. Para converter em token de longa duração (~60 dias):

```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=SEU_APP_ID&client_secret=SEU_APP_SECRET&fb_exchange_token=TOKEN_CURTO"
```

6. Copiar o `access_token` da resposta.

**Opção B — System User Token (recomendado para produção):**

1. Ir a **Business Manager > Business Settings > System Users**
2. Criar um System User (nome: `Metria Bot`)
3. Atribuir as permissões `ads_read` e `read_insights` à conta de anúncios do cliente
4. Gerar token com os scopes necessários
5. Este token não expira (enquanto o System User existir)

### 3.4 — Obter o Ad Account ID

1. Ir a **Business Manager > Business Settings > Accounts > Ad Accounts**
2. Copiar o ID (ex: `123456789`)
3. No Metria, inserir como `act_123456789` no campo "Ad Account ID"

Preencher no `.env.local`:

```
META_APP_ID="seu-app-id"
META_APP_SECRET="seu-app-secret"
```

O token de acesso do cliente será inserido na página `/clients/[id]` (secção Integrações).

---

## PASSO 4 — OpenAI

**Tempo estimado:** 5 minutos

1. Ir a https://platform.openai.com/api-keys
2. Criar uma nova API key (nome: `Metria`)
3. Copiar a key

Preencher no `.env.local`:

```
OPENAI_API_KEY="sk-xxxx"
```

**Nota:** O `analyze.ts` usa o modelo `gpt-4o`. Certifique-se de que a sua conta tem acesso ao GPT-4o (requer plano pago ou créditos).

---

## PASSO 5 — Cloudflare R2

**Tempo estimado:** 10 minutos

1. Ir a https://dash.cloudflare.com → **R2 Object Storage**
2. Criar um bucket (nome: `metria-reports`)
3. Ir a **R2 > Manage R2 API Tokens**
4. Criar um token com permissão **Object Read & Write** no bucket `metria-reports`
5. Copiar:
   - Account ID (está no URL do dashboard: `https://dash.cloudflare.com/{ACCOUNT_ID}/r2`)
   - Access Key ID
   - Secret Access Key

Preencher no `.env.local`:

```
R2_ACCOUNT_ID="seu-account-id"
R2_ACCESS_KEY_ID="xxxx"
R2_SECRET_ACCESS_KEY="xxxx"
R2_BUCKET_NAME="metria-reports"
R2_PUBLIC_URL=""
```

`R2_PUBLIC_URL` pode ficar vazio — o sistema usa signed URLs (30 dias de expiração).

---

## PASSO 6 — Z-API (WhatsApp) — OPCIONAL para primeiro teste

**Tempo estimado:** 15 minutos (se quiser configurar agora)

O pipeline funciona sem WhatsApp — o `deliver.ts` faz health check e pula se a Z-API não estiver configurada.

Se quiser configurar:

1. Ir a https://z-api.io e criar conta
2. Criar uma instância
3. Conectar o WhatsApp (escanear QR code)
4. Copiar Instance ID e Token

Preencher no `.env.local`:

```
ZAPI_INSTANCE_ID="seu-instance-id"
ZAPI_TOKEN="seu-token"
ZAPI_SECURITY_TOKEN=""
```

**Para o primeiro teste E2E, pode deixar vazio.** O pipeline vai enviar apenas por e-mail.

---

## PASSO 7 — Resend (E-mail)

**Tempo estimado:** 10 minutos

1. Ir a https://resend.com e criar conta
2. Ir a **API Keys** e criar uma key
3. Para testes, pode usar o domínio sandbox (`onboarding@resend.dev`) — mas só envia para o seu próprio email
4. Para produção, verificar o seu domínio em **Domains**

Preencher no `.env.local`:

```
RESEND_API_KEY="re_xxxx"
EMAIL_FROM="relatorios@seudominio.com"
```

Se usar sandbox, colocar `EMAIL_FROM="onboarding@resend.dev"`.

---

## PASSO 8 — Inngest (para dev local)

**Tempo estimado:** 5 minutos

Para desenvolvimento local, o Inngest roda em modo dev (sem chaves). As variáveis `INNGEST_EVENT_KEY` e `INNGEST_SIGNING_KEY` são necessárias apenas em produção.

Para testar localmente:

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Inngest Dev Server
npx inngest-cli@latest dev
```

O Inngest Dev Server vai detectar automaticamente o endpoint em `http://localhost:3000/api/inngest`.

Para o primeiro teste, pode deixar as variáveis Inngest vazias no `.env.local`:

```
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""
```

---

## PASSO 9 — Teste E2E (O Momento da Verdade)

Após preencher TODAS as variáveis acima no `.env.local`:

### 9.1 — Subir a aplicação

```bash
npm run db:push
npm run db:seed
npm run dev
```

### 9.2 — Fazer login

1. Abrir `http://localhost:3000/login`
2. Email: `admin@metria.com`
3. Senha: `admin123`
4. Deve redirecionar para o Dashboard

### 9.3 — Configurar um cliente real

1. Ir a **Clientes** → clicar num dos clientes de teste
2. Na secção **Integrações**:
   - Preencher **Property ID (GA4)**: `properties/XXXXXXXXX`
   - Preencher **Site URL (Search Console)**: `https://seusite.com`
   - Colar o **Access Token** e **Refresh Token** do Google (obtidos no Passo 2.4)
   - Clicar **Salvar Google**
3. Se tiver Meta Ads:
   - Preencher **Ad Account ID**: `act_XXXXXXXXX`
   - Colar o **Access Token** do Meta (obtido no Passo 3.3)
   - Clicar **Salvar Meta**

### 9.4 — Disparar o pipeline

1. Na mesma página do cliente, clicar **Gerar Relatório (mês anterior)**
2. Acompanhar o status em **Relatórios**

### 9.5 — O que esperar (e onde vai falhar)

| Etapa | Status no Report | Erro provável | Causa | Fix |
|---|---|---|---|---|
| Ingest | `INGESTING` | `401 Unauthorized` | Token expirado ou scopes insuficientes | Regerar token no OAuth Playground com os scopes correctos |
| Ingest | `INGESTING` | `403 Forbidden` | Conta Google não tem acesso à propriedade GA4 | Verificar que o email autorizou acesso à propriedade no GA4 Admin |
| Ingest | `INGESTING` | `Google token refresh failed: 400` | `GOOGLE_CLIENT_ID` ou `GOOGLE_CLIENT_SECRET` errados | Verificar credenciais no Google Cloud Console |
| Process | `PROCESSING` | Sem dados | Nenhuma métrica foi ingerida (todas as integrações falharam) | Corrigir o ingest primeiro |
| Analyze | `ANALYZING` | `401 Unauthorized` | API key OpenAI inválida ou sem créditos | Verificar key e saldo em platform.openai.com |
| Compile | `COMPILING` | Crash de memória ou layout quebrado | Dados reais com strings longas | Fix cirúrgico no template PDF |
| Store | `STORING` | `403 Forbidden` ou `SignatureDoesNotMatch` | Credenciais R2 erradas ou bucket não existe | Verificar token R2 e nome do bucket |
| Deliver | `DELIVERING` | `Resend error` | API key inválida ou domínio não verificado | Usar sandbox para teste |
| Deliver | `DELIVERING` | Z-API timeout | Sessão WhatsApp desconectada | Reconectar no painel Z-API (ou ignorar — e-mail basta) |

---

## CHECKLIST FINAL DO `.env.local`

```bash
# ── Banco de dados (Neon) ──
DATABASE_URL="postgresql://..."        # ✓ Passo 1
DIRECT_URL="postgresql://..."          # ✓ Passo 1

# ── App ──
NEXTAUTH_SECRET="..."                  # ✓ Passo 0
NEXTAUTH_URL="http://localhost:3000"   # ✓ Passo 0
AGENCY_ID="..."                        # ✓ Passo 0 + Passo 1 (seed)

# ── Criptografia ──
ENCRYPTION_KEY="..."                   # ✓ Passo 0

# ── Google APIs ──
GOOGLE_CLIENT_ID="..."                 # ✓ Passo 2.3
GOOGLE_CLIENT_SECRET="..."             # ✓ Passo 2.3

# ── Meta / Facebook ──
META_APP_ID="..."                      # ✓ Passo 3.1
META_APP_SECRET="..."                  # ✓ Passo 3.3

# ── OpenAI ──
OPENAI_API_KEY="..."                   # ✓ Passo 4

# ── Cloudflare R2 ──
R2_ACCOUNT_ID="..."                    # ✓ Passo 5
R2_ACCESS_KEY_ID="..."                 # ✓ Passo 5
R2_SECRET_ACCESS_KEY="..."             # ✓ Passo 5
R2_BUCKET_NAME="metria-reports"        # ✓ Passo 5
R2_PUBLIC_URL=""                       # ✓ Passo 5

# ── Z-API (WhatsApp) — OPCIONAL ──
ZAPI_INSTANCE_ID=""                    # ✓ Passo 6 (ou vazio)
ZAPI_TOKEN=""                          # ✓ Passo 6 (ou vazio)
ZAPI_SECURITY_TOKEN=""                 # ✓ Passo 6 (ou vazio)

# ── E-mail (Resend) ──
RESEND_API_KEY="..."                   # ✓ Passo 7
EMAIL_FROM="..."                       # ✓ Passo 7

# ── Inngest — vazio para dev local ──
INNGEST_EVENT_KEY=""                   # ✓ Passo 8
INNGEST_SIGNING_KEY=""                 # ✓ Passo 8
```

---

## APÓS O TESTE E2E

Quando o pipeline rodar com sucesso (ou falhar em pontos específicos), os próximos blocos são:

**Bloco B — Ajustes pós-teste:** Corrigir layout do PDF com dados reais, refinar prompt OpenAI, tratar edge cases (cliente sem Google, sem Meta, sem dados do mês anterior).

**Bloco C — Deploy:** Coolify na VPS, domínio, Inngest em produção, monitoramento.

**NÃO avançar para o Bloco B/C até o pipeline E2E completar pelo menos 1 vez com dados reais.**
