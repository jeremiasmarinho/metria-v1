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
