# Metria — Guia de Manutenção

Documento para facilitar a manutenção, debugging e evolução do projeto. Consulte também `ARCHITECTURE.md` para detalhes técnicos.

---

## 1. Estrutura de arquivos principais

| Caminho | Responsabilidade |
|---------|------------------|
| `src/app/(dashboard)/` | Páginas do dashboard (clientes, relatórios, settings) |
| `src/app/api/` | Rotas de API (Next.js Route Handlers) |
| `src/components/` | Componentes React reutilizáveis |
| `src/lib/` | Lógica de negócio, integrações, pipeline |
| `src/lib/pipeline/` | Pipeline de geração de relatórios (ingest → process → analyze → compile → store → deliver) |
| `src/lib/inngest/` | Funções Inngest (manual-report, monthly-report) |
| `prisma/schema.prisma` | Modelagem do banco de dados |

---

## 2. Variáveis de ambiente obrigatórias

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Conexão com PostgreSQL (Neon) |
| `DIRECT_URL` | Conexão direta para migrations |
| `NEXTAUTH_SECRET` | Sessões NextAuth |
| `NEXTAUTH_URL` | URL base da aplicação |
| `AGENCY_ID` | ID fixo da agência (CUID do banco) |
| `ENCRYPTION_KEY` | Criptografia de tokens OAuth (32 bytes hex) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth Google (GA4, Search Console, Ads) |
| `META_APP_ID`, `META_APP_SECRET` | OAuth Meta Ads |
| `OPENAI_API_KEY` | Análise de métricas via GPT |
| `RESEND_API_KEY`, `EMAIL_FROM` | Envio de e-mail |
| `R2_*` | Armazenamento de PDFs (Cloudflare R2) |

Variáveis opcionais: `INNGEST_*` (produção), `ZAPI_*` (WhatsApp), `GOOGLE_ADS_DEVELOPER_TOKEN`.

### Easypanel — porta do domínio

O app escuta na **porta 3000** (`PORT=3000` no Dockerfile). No Easypanel, em **Domínios** → editar domínio → **Destino**, a porta deve ser **3000**. Se estiver 880 ou outra, o site fica "Service is not reachable".

---

## 3. Fluxo de geração de relatórios

1. **Trigger**: Botão "Gerar relatório" ou cron Inngest (dia 05 do mês).
2. **API** `POST /api/reports` → cria registro com status PENDING.
3. **API** `POST /api/reports/[id]/generate` → dispara evento Inngest `metria/generate-report`.
4. **Inngest** executa `manualReport` em `src/lib/inngest/monthly-report.ts`.
5. **Pipeline**: `ingestClientMetrics` → `processClientMetrics` → `analyzeMetrics` → `compileReportPdf` → `storeReportPdf` → `deliverReport`.

**Ordem de ingest**: Google (GA4, Search Console) e Meta Ads. Usa tokens em `client.integrations` ou fallback para `agency_connections`.

---

## 4. Tarefas comuns

### Atualizar dependências
```bash
npm update
npm run db:generate  # Após alterar Prisma
```

### Rodar migrations
```bash
npm run db:migrate
```

### Seed do banco (dados iniciais)
```bash
npm run db:seed
```

### Verificar credenciais e integrações
```bash
npm run verify-credentials
```

### Desenvolvimento local (Inngest)
```bash
# Terminal 1
npm run dev

# Terminal 2
npx inngest-cli dev
```

---

## 5. Guia de instalação (Conectar conta pai)

A interface exibe um único botão "Conectar" para Google e Meta. Para isso funcionar, o administrador deve configurar as credenciais OAuth **uma vez** no servidor. Consulte a página **Configurações → Guia de instalação** (ou `/docs/setup`) para instruções detalhadas de como criar os apps no Google Cloud e Meta for Developers e adicionar as variáveis ao `.env`.

---

## 6. Troubleshooting

### Relatório não avança de "Preparando..."
- **Causa**: Inngest Dev Server não está rodando.
- **Solução**: Execute `npx inngest-cli dev` em um terminal separado.

### "missing required error components, refreshing"
- **Causa**: Múltiplas instâncias do Next.js ou cache corrompido.
- **Solução**: Pare todos os processos (`pkill -f "next dev"`), exclua `.next`, rode `npm run dev`.

### Erro ao listar contas Google/Meta
- **Causa**: Token da agência expirado ou desconectado.
- **Solução**: Reconectar em Configurações → Conecte Google Ads / Meta.

### Pipeline falha com `INGEST_NO_VALID_SOURCES`
- **Causa**: Nenhuma fonte de dados (GA4, GSC, Meta) retornou métricas.
- **Solução**: Verifique integrações do cliente, tokens válidos e `reportConfig` (googlePropertyId, googleSiteUrl, metaAdAccountId).

### Tour de onboarding não aparece
- **Causa**: Tour foi dispensado anteriormente (localStorage).
- **Solução**: Na página Novo cliente, clique em "Ver tour novamente" ou limpe `metria-onboarding-tour-new-client` no localStorage.

---

## 7. Deploy (VPS / Coolify)

1. Configurar variáveis de ambiente no painel.
2. Build: `npm run build`.
3. Start: `npm run start`.
4. **Inngest**: Em produção, configurar Inngest Cloud ou self-hosted; garantir que `INNGEST_EVENT_KEY` e `INNGEST_SIGNING_KEY` estejam definidos.
5. **Cron**: O Inngest agenda automaticamente o job mensal (dia 02, 6h).

---

## 8. Testes

```bash
npm test           # Rodar todos os testes
npm run test:watch # Modo watch
```

---

## 9. Convenções de código

- **Componentes**: Preferir `"use client"` apenas quando necessário (estado, efeitos, event handlers).
- **APIs**: Usar `requireAuth()` de `@/lib/auth` para rotas protegidas.
- **Feedback**: Usar `notify()` de `@/lib/ui-feedback` em vez de `alert()`.
- **Validação**: Zod para payloads de API e formulários.
