# TASK — Redesign UI/UX do Metria (Senior UX/UI)

> **Contexto:** O Metria é um painel B2B interno para agências de marketing. Gera relatórios automáticos (PDF) a partir de dados do Google Analytics, Search Console e Meta Ads. O utilizador principal é o dono de uma agência — não é técnico, quer ver dados de forma clara e executar acções com poucos cliques.
>
> **Stack:** Next.js 14 (App Router), Tailwind CSS, Shadcn UI (apenas `Button` e `Card` instalados), Lucide React para ícones.
>
> **Restrição absoluta:** NÃO altere nenhum ficheiro fora de `src/app/`, `src/components/` e `src/app/globals.css`. NÃO toque em `src/lib/`, `src/pdf/`, `src/types/`, `prisma/`, API routes (`src/app/api/`), `src/middleware.ts`, nem `src/components/providers.tsx`. A lógica de negócio, API e autenticação estão prontas — este redesign é puramente visual.

---

## O que está mal na UI actual

### Diagnóstico visual

1. **Sem identidade de marca.** A palette é o default do Shadcn (cinza neutro, preto, branco). Parece um boilerplate, não um produto. Não tem cor primária da marca, não tem gradientes, não tem personalidade.

2. **Sidebar genérica.** Texto plano "Metria", sem logo/ícone, sem indicação visual da rota activa, sem hover states diferenciados. O bloco do utilizador no fundo é minimalista demais (nome + "Sair" em texto xs).

3. **Header vazio.** Apenas um `<h1>` com o título. Não há breadcrumbs, não há acções contextuais, não há indicador de status do sistema.

4. **Dashboard sem conteúdo.** Dois cards genéricos (Clientes e Relatórios) com contadores. Para um painel de marketing, deveria ter um resumo visual do mês: quantos relatórios gerados, quantos falharam, último relatório, próxima execução do cron.

5. **Cards de cliente são planos.** Sem avatar/iniciais, sem indicação visual do estado das integrações (Google configurado? Meta configurado?), sem data de último relatório.

6. **Formulários sem estilo.** Os inputs usam `className="w-full rounded-md border px-3 py-2"` — não usam os tokens do Shadcn, não têm focus rings consistentes, não têm labels com for/id correcto, não têm descrições helper.

7. **Página de login sem marca.** Formulário centrado com borda fina. Sem logo, sem gradiente de fundo, sem indicação de que é o Metria.

8. **Página de settings é uma lista estática.** Sem agrupamento visual, sem ícones nos serviços, os ✓/✗ são text puro em vez de badges coloridos.

9. **Página do cliente (detalhe) é uma stack vertical infinita.** Informações, relatórios, gerar relatório, integrações — tudo em sequência. Falta tabs ou secções com separação visual clara.

10. **Sem feedback visual.** Os botões de "Salvar Google"/"Salvar Meta" não têm loading spinner, as mensagens de sucesso/erro são `<p>` simples sem animação.

---

## O que fazer — Especificação por componente

### 0. Design Tokens (`src/app/globals.css`)

Substituir a palette genérica por uma identidade de marca. Sugestão de direcção:

- **Primary:** Um azul profundo ou índigo (profissional, confiança — é um produto B2B financeiro)
- **Accent:** Um verde ou teal para estados de sucesso
- **Destructive:** Manter vermelho
- **Superfícies:** Usar um off-white levemente quente no background, não branco puro

Exemplo de direcção (adaptar como achar melhor):

```css
:root {
  --primary: 221 83% 53%;        /* Indigo-600 */
  --primary-foreground: 0 0% 100%;
  --accent: 160 84% 39%;          /* Emerald-500 */
  ...
}
```

Usar o formato HSL sem `hsl()` wrapper (Shadcn pattern).

Adicionar variáveis dark mode coerentes.

---

### 1. Sidebar (`src/components/layout/sidebar.tsx`)

**Estado actual:** Texto "Metria", lista de links sem active state, bloco de user minimalista.

**O que fazer:**

- Adicionar um logotipo ou ícone de marca no topo (pode ser as iniciais "M" num círculo colorido + "Metria" ao lado em font semibold).
- Implementar **active state** no link da rota actual usando `usePathname()` de `next/navigation`. O link activo deve ter `bg-primary/10 text-primary font-medium` ou similar.
- Hover state mais visível nos links.
- O bloco do utilizador no fundo deve ter:
  - Avatar com iniciais (círculo colorido com as iniciais do nome)
  - Nome em font medium
  - Role em text-xs muted
  - Botão "Sair" como ícone (LogOut do Lucide) com tooltip ou ao lado do nome
- Separar visualmente o bloco de navegação do bloco de utilizador com um divisor suave.

**Ficheiro:** `src/components/layout/sidebar.tsx` (já é `"use client"`, já tem `useSession`)

---

### 2. Header (`src/components/layout/header.tsx`)

**Estado actual:** `<h1>` com título.

**O que fazer:**

- Adicionar breadcrumbs simples (Home > Clientes > Nome do Cliente). Pode receber `breadcrumbs?: Array<{label: string, href?: string}>` como prop.
- Alinhar à direita: um badge com o status do sistema (online/offline) ou simplesmente a data actual formatada.
- Altura: manter `h-14` mas adicionar padding e um `border-b` mais suave (usar `border-border/50`).

**Ficheiro:** `src/components/layout/header.tsx`

**Nota:** O `Shell` (`src/components/layout/shell.tsx`) deve passar os breadcrumbs para o Header. Actualizar as props do Shell.

---

### 3. Página de Login (`src/app/(auth)/login/page.tsx`)

**Estado actual:** Formulário centrado com borda.

**O que fazer:**

- Split layout: metade esquerda com gradiente (primary → accent) + nome "Metria" grande + tagline ("Relatórios de marketing no piloto automático"); metade direita com o formulário.
- Em mobile: formulário full width com gradiente subtil no topo.
- Inputs com focus ring da cor primary.
- Botão com gradiente ou cor primary sólida, com hover state.
- Mensagem de erro com ícone (AlertCircle do Lucide).

**Ficheiro:** `src/app/(auth)/login/page.tsx`

---

### 4. Dashboard Home (`src/app/(dashboard)/page.tsx`)

**Estado actual:** Dois cards de contagem.

**O que fazer:**

- Grid de 4 stat cards: Clientes activos, Relatórios do mês, Taxa de sucesso (COMPLETED vs FAILED), Último relatório gerado.
- Cada stat card com: ícone à esquerda, valor grande, label em muted, e uma variação (ex: "+2 este mês" — pode ser placeholder estático por agora).
- Abaixo dos stats: uma secção "Últimos relatórios" com os 5 relatórios mais recentes (mini-tabela ou lista).
- Card de "Próxima execução" indicando dia 02 do mês seguinte.

**Ficheiro:** `src/app/(dashboard)/page.tsx`

**Nota:** Os dados vêm do Prisma (a query já existe). Pode expandir a query para buscar últimos 5 relatórios e contar COMPLETED/FAILED.

---

### 5. Lista de Clientes (`src/app/(dashboard)/clients/page.tsx`)

**Estado actual:** Grid de ClientCards simples.

**O que fazer no ClientCard** (`src/components/clients/client-card.tsx`):

- Avatar com iniciais do cliente (círculo com 2 letras, cor gerada a partir do nome).
- Indicadores visuais: badges pequenos mostrando quais integrações estão configuradas (ícone Google, ícone Meta — preenchidos se configurado, outline se não).
- Data do último relatório (ou "Sem relatórios").
- Badge de "Ativo"/"Inativo" com cor (verde/cinza).

**Nota:** O `ClientCard` recebe `id`, `name`, `slug`, `active`, `email`. Para mostrar integrações, a página-pai (`clients/page.tsx`) terá de passar mais dados. Expandir as props do card ou expandir a query na página.

---

### 6. Detalhe do Cliente (`src/app/(dashboard)/clients/[id]/page.tsx`)

**Estado actual:** Stack vertical com Informações → Gerar Relatório → Relatórios → Integrações.

**O que fazer:**

- Header do cliente: nome grande, badge de status, email e telefone inline.
- **Tabs** para organizar o conteúdo: "Relatórios" | "Integrações" | "Informações".
- A tab "Relatórios" mostra os relatórios + o botão de gerar.
- A tab "Integrações" mostra o `ClientIntegrations`.
- A tab "Informações" mostra os dados base.

Implementar tabs com Shadcn UI. Se `Tabs` não estiver instalado, criar manualmente com `useState` e classes condicionais (é simples, não precisa instalar o componente).

**Ficheiros:**
- `src/app/(dashboard)/clients/[id]/page.tsx`
- `src/components/clients/client-integrations.tsx`
- `src/components/clients/generate-report-button.tsx`

---

### 7. Formulário de Cliente (`src/components/clients/client-form.tsx`)

**Estado actual:** Inputs com classes inline, sem consistência com o design system.

**O que fazer:**

- Criar um componente `Input` base em `src/components/ui/input.tsx` (padrão Shadcn: `className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"`).
- Criar um componente `Label` base em `src/components/ui/label.tsx`.
- Substituir todos os `<input className="...">` e `<label className="...">` nos formulários por `<Input>` e `<Label>`.
- Aplicar em: `client-form.tsx`, `client-integrations.tsx`, `login/page.tsx`.

---

### 8. Formulário de Integrações (`src/components/clients/client-integrations.tsx`)

**Estado actual:** Dois blocos de formulário com inputs simples.

**O que fazer:**

- Agrupar cada integração num card com ícone do serviço no header (ícone Google multicolorido, ícone Meta azul — usar SVG inline simples ou Lucide se existir).
- Status badge: "Configurado" (verde) ou "Não configurado" (cinza) com ícones (CheckCircle, XCircle).
- Botão de salvar com loading spinner (ícone Loader2 do Lucide com `animate-spin`).
- Mensagem de sucesso/erro como toast ou alert inline com ícone e animação (fade in).
- Os campos de token (`type="password"`) devem ter um botão toggle para mostrar/esconder.

**Ficheiro:** `src/components/clients/client-integrations.tsx`

---

### 9. Botão Gerar Relatório (`src/components/clients/generate-report-button.tsx`)

**Estado actual:** Botão + mensagem em `<p>`.

**O que fazer:**

- Botão com ícone (Play ou Zap do Lucide) + texto.
- Loading state com spinner (Loader2 animate-spin) substituindo o texto.
- Mensagem de resultado como alert inline (success: verde com CheckCircle, error: vermelho com AlertCircle).

**Ficheiro:** `src/components/clients/generate-report-button.tsx`

---

### 10. Lista e Detalhe de Relatórios

**ReportCard** (`src/components/reports/report-card.tsx`):
- Adicionar ícone do status (CheckCircle verde para COMPLETED, XCircle vermelho para FAILED, Loader2 animado para estados intermediários).
- Layout horizontal: nome do cliente | período | status badge | seta para detalhe.

**ReportStatus** (`src/components/reports/report-status.tsx`):
- Manter a lógica actual mas melhorar visualmente: adicionar ícone antes do label, usar cores mais vibrantes com border em vez de apenas background.

**Detalhe do Relatório** (`src/app/(dashboard)/reports/[id]/page.tsx`):
- Card da análise executiva com tipografia melhor (text-base, line-height relaxado, background suave).
- Card de erro com ícone AlertTriangle.
- Botão de download PDF mais proeminente (size="lg", ícone Download).

---

### 11. Página de Settings (`src/app/(dashboard)/settings/page.tsx`)

**Estado actual:** Lista de ✓/✗ em texto.

**O que fazer:**

- Cada serviço num card individual com: ícone do serviço, nome, status badge (colorido), descrição curta.
- Agrupar em secções: "Infra" (DB, App), "APIs" (Google, Meta, OpenAI), "Entrega" (R2, Z-API, Resend), "Orquestração" (Inngest).
- O ✓/✗ deve ser um badge visual (CheckCircle verde / XCircle cinza).

**Ficheiro:** `src/app/(dashboard)/settings/page.tsx`

---

## Regras de execução

1. **Instale componentes Shadcn necessários** com `npx shadcn-ui@latest add <component>`. Componentes recomendados: `input`, `label`, `badge`, `tabs`, `separator`, `avatar`, `tooltip`. NÃO instale componentes que não vai usar.

2. **Use apenas Tailwind CSS e Shadcn.** Não adicione outras bibliotecas de UI (Material, Chakra, Ant, etc.).

3. **Use Lucide React para ícones.** Já está instalado (`lucide-react`). Não adicione outra lib de ícones.

4. **Todos os inputs devem usar focus-visible** (ring) consistente com a cor primary. Nunca `outline: none` sem ring alternativo.

5. **O build deve passar.** Após todas as alterações, executar `npm run build` e `npm run test`. Nenhum erro novo deve ser introduzido.

6. **NÃO altere props de componentes que são passadas por páginas server-side** sem actualizar a página correspondente. As páginas em `src/app/(dashboard)/` são Server Components que fazem queries Prisma. Se alterar uma prop de um componente, altere também a página que o renderiza.

7. **Mantenha `"use client"` apenas nos componentes que já o têm** ou nos novos que usam hooks/events. NÃO converter Server Components em Client Components.

8. **A sidebar já é `"use client"` com `useSession`.** Pode adicionar `usePathname()` sem problemas.

9. **O tema dark mode já está definido em `globals.css`.** Se alterar os tokens light, altere também os dark correspondentes.

10. **Responsive:** A sidebar pode ser fixa em desktop (md+) e colapsável em mobile (<md). Se implementar collapse, use um estado local com hamburger no header.

---

## Ficheiros a alterar (lista completa)

| Ficheiro | Tipo de alteração |
|---|---|
| `src/app/globals.css` | Nova palette de cores (design tokens) |
| `src/components/layout/sidebar.tsx` | Active state, logo, avatar, estilo |
| `src/components/layout/header.tsx` | Breadcrumbs, data, estilo |
| `src/components/layout/shell.tsx` | Passar breadcrumbs para Header |
| `src/app/(auth)/login/page.tsx` | Split layout, gradiente, marca |
| `src/app/(dashboard)/page.tsx` | Stat cards, últimos relatórios |
| `src/app/(dashboard)/clients/page.tsx` | Expandir query se necessário |
| `src/app/(dashboard)/clients/[id]/page.tsx` | Tabs, header do cliente |
| `src/app/(dashboard)/clients/new/page.tsx` | Usar novos Input/Label |
| `src/app/(dashboard)/reports/page.tsx` | Estilo da lista |
| `src/app/(dashboard)/reports/[id]/page.tsx` | Card de análise, botão PDF |
| `src/app/(dashboard)/settings/page.tsx` | Cards por serviço, ícones |
| `src/components/clients/client-card.tsx` | Avatar, badges de integração |
| `src/components/clients/client-form.tsx` | Usar Input/Label Shadcn |
| `src/components/clients/client-integrations.tsx` | Cards, spinner, toggle |
| `src/components/clients/generate-report-button.tsx` | Spinner, alert inline |
| `src/components/reports/report-card.tsx` | Layout horizontal, ícones |
| `src/components/reports/report-status.tsx` | Ícones, cores mais vibrantes |
| `src/components/ui/input.tsx` | **Criar** (Shadcn Input) |
| `src/components/ui/label.tsx` | **Criar** (Shadcn Label) |
| `src/components/ui/badge.tsx` | **Criar** (Shadcn Badge) |
| `tailwind.config.ts` | Estender tema se necessário (cores, font) |

---

## O que NÃO alterar

- `src/lib/*` (lógica de negócio, crypto, db, pipeline, integrations, inngest)
- `src/pdf/*` (template PDF)
- `src/types/*` (tipos TypeScript)
- `src/app/api/*` (API routes)
- `src/middleware.ts` (autenticação)
- `src/components/providers.tsx` (SessionProvider)
- `prisma/*` (schema, seed)
- Ficheiros de configuração raiz (next.config.mjs, tsconfig.json, vitest.config.ts)
- `ARCHITECTURE.md`, `TASKS.md`, `README.md`
