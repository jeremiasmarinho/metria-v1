# Metria V1

Motor de Automação B2B para geração e entrega de relatórios de marketing.

## Visão Geral

O Metria é um sistema interno de agência que, todo dia 02 do mês:

1. Extrai métricas de Google Analytics 4, Search Console e Meta Ads
2. Processa análise executiva via OpenAI (GPT-4o)
3. Gera um PDF com dados + análise
4. Envia o PDF via WhatsApp (Z-API) e e-mail para cada cliente

## Stack

- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** TypeScript 5+
- **UI:** Tailwind CSS + Shadcn UI
- **ORM:** Prisma
- **Background Jobs:** Inngest
- **PDF:** @react-pdf/renderer
- **IA:** OpenAI GPT-4o
- **E-mail:** Resend
- **Storage:** Cloudflare R2

> **Nota:** Gráficos no PDF (chartjs-node-canvas) foram omitidos por dependências nativas. Para adicionar, instale `chartjs-node-canvas` e as libs do sistema (pixman, cairo).

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
# Editar .env.local com suas credenciais
```

### 3. Banco de dados

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run db:generate` | Gerar Prisma Client |
| `npm run db:push` | Aplicar schema ao banco |
| `npm run db:seed` | Popular dados iniciais |
| `npm run db:studio` | Abrir Prisma Studio |
| `npm run test` | Rodar testes |

## Arquitetura

Consulte [ARCHITECTURE.md](./ARCHITECTURE.md) para a documentação técnica completa.

---

## Guia de Handover (Entrega ao Cliente)

Para passar o sistema para a infraestrutura final do cliente (servidor, Coolify, VPS, etc.), **é suficiente alterar as variáveis do ficheiro `.env.local`**. Não é necessário modificar código.

### O que fazer

1. Copiar o ficheiro `.env.example` para `.env.local` (ou editar o `.env.local` existente).
2. Substituir cada variável abaixo pelos valores da infraestrutura do cliente.
3. Guardar o ficheiro e fazer deploy da aplicação (Docker, Coolify, etc.).

### Variáveis que precisam ser substituídas

| Variável | Serviço | Descrição |
|----------|---------|-----------|
| `DATABASE_URL` | Neon / PostgreSQL | URL de conexão ao banco de dados (pooled) |
| `DIRECT_URL` | Neon / PostgreSQL | URL de conexão directa (migrações) |
| `NEXTAUTH_SECRET` | App | Chave secreta para sessões (gerar com `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App | URL pública da aplicação (ex: `https://metria.seudominio.com`) |
| `AGENCY_ID` | App | ID único da agência (vem do seed; manter o mesmo se já configurado) |
| `ENCRYPTION_KEY` | App | Chave para criptografar tokens OAuth (gerar com `openssl rand -hex 32`) |
| `GOOGLE_CLIENT_ID` | Google | Client ID do projeto OAuth no Google Cloud |
| `GOOGLE_CLIENT_SECRET` | Google | Client Secret do projeto OAuth |
| `META_APP_ID` | Meta | App ID no Meta for Developers |
| `META_APP_SECRET` | Meta | App Secret no Meta for Developers |
| `OPENAI_API_KEY` | OpenAI | API Key da plataforma OpenAI |
| `R2_ACCOUNT_ID` | Cloudflare R2 | ID da conta Cloudflare |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 | Chave de acesso do token R2 |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 | Chave secreta do token R2 |
| `R2_BUCKET_NAME` | Cloudflare R2 | Nome do bucket onde os PDFs são guardados |
| `R2_PUBLIC_URL` | Cloudflare R2 | (Opcional) URL pública do bucket; pode ficar vazio |
| `ZAPI_INSTANCE_ID` | Z-API (WhatsApp) | ID da instância Z-API |
| `ZAPI_TOKEN` | Z-API (WhatsApp) | Token da instância |
| `ZAPI_SECURITY_TOKEN` | Z-API (WhatsApp) | Token de segurança (opcional) |
| `RESEND_API_KEY` | Resend (E-mail) | API Key do Resend |
| `EMAIL_FROM` | Resend (E-mail) | E-mail remetente dos relatórios |
| `INNGEST_EVENT_KEY` | Inngest | Chave para eventos em produção |
| `INNGEST_SIGNING_KEY` | Inngest | Chave para assinar webhooks em produção |

### ⚠️ Lembrete de segurança

**O ficheiro `.env.local` NUNCA deve ser commitado no GitHub.** Este ficheiro contém credenciais sensíveis (palavras-passe, chaves de API, tokens). O projeto já inclui `.env.local` no `.gitignore` para evitar submissões acidentais. Ao fazer handover, entregue o ficheiro `.env.local` ao cliente por um canal seguro (ex: gestor de palavras-passe, transferência encriptada), nunca por e-mail em texto simples ou no repositório.
