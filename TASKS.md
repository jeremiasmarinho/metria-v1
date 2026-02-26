# TAREFAS — Autenticação, Testes Críticos, Settings e Prova de Fogo

> **Documento de execução para o Composer.**
> Toda alteração DEVE respeitar o ficheiro `ARCHITECTURE.md` na raiz do projeto.
> NÃO crie ficheiros fora da estrutura da secção 4 da arquitetura (excepto onde indicado).
> NÃO invente variáveis de ambiente — use apenas as da secção 6.
> NÃO altere o `prisma/schema.prisma`.
> NÃO altere ficheiros do pipeline (`src/lib/pipeline/*`, `src/lib/integrations/*`, `src/lib/inngest/*`).

---

## PASSO 1 — Autenticação com NextAuth (Bloqueante)

A secção 8 do `ARCHITECTURE.md` define:
- Autenticação: NextAuth.js com provider Credentials (V1)
- Sessão: JWT com NEXTAUTH_SECRET
- Senhas: Hash com bcrypt (salt rounds: 12)

O seed (`prisma/seed.ts`) já cria o utilizador `admin@metria.com` com password `admin123` (bcrypt, 12 rounds). NÃO criar ecrãs de registo nem recuperação de password. O único caminho de entrada é o login.

---

### Tarefa 1.1 — Criar a rota NextAuth

**Ficheiro a criar:** `src/app/api/auth/[...nextauth]/route.ts`

**O que fazer:**

1. Configurar NextAuth com o Credentials Provider.
2. A função `authorize` deve:
   - Receber `email` e `password` do formulário
   - Buscar o utilizador na tabela `User` via Prisma (`db.user.findUnique({ where: { email } })`)
   - Comparar a password com `bcryptjs.compare(password, user.password)`
   - Se válido, retornar `{ id: user.id, email: user.email, name: user.name, role: user.role }`
   - Se inválido, retornar `null`
3. Configurar sessão JWT:
   - `session: { strategy: "jwt" }`
   - `secret: process.env.NEXTAUTH_SECRET`
4. Configurar callbacks:
   - `jwt`: incluir `user.id` e `user.role` no token
   - `session`: incluir `id` e `role` na sessão
5. Configurar `pages: { signIn: "/login" }` para redirecionar para a página de login existente.

**Estrutura do ficheiro:**

```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
```

**Restrição:** NÃO usar `@auth/prisma-adapter`. O schema não tem as tabelas Account/Session/VerificationToken do adapter. Usar apenas JWT puro.

**Restrição:** Marcar a rota como `export const dynamic = "force-dynamic";` para evitar prerender.

---

### Tarefa 1.2 — Conectar a página de login ao NextAuth

**Ficheiro:** `src/app/(auth)/login/page.tsx`

**Problema actual:** A página de login é um formulário HTML estático que não faz nada.

**O que fazer:**

1. Converter para `"use client"`.
2. Importar `signIn` de `next-auth/react`.
3. Usar `useState` para `email`, `password` e `error`.
4. No `onSubmit`:
   - Chamar `signIn("credentials", { email, password, redirect: false })`
   - Se `result?.error`, mostrar mensagem de erro
   - Se sucesso, redirecionar para `/` com `router.push("/")`
5. Manter o visual actual (formulário centrado, inputs de email e password, botão "Entrar").

**Restrição:** NÃO adicionar link de registo. NÃO adicionar "Esqueci a senha". Apenas email + password + botão.

---

### Tarefa 1.3 — Criar middleware de autenticação

**Ficheiro a criar:** `src/middleware.ts` (na raiz de `src/`, NÃO dentro de `app/`)

**O que fazer:**

1. Usar `getToken` de `next-auth/jwt` para verificar se o utilizador tem sessão.
2. Proteger TODAS as rotas excepto:
   - `/login`
   - `/api/auth/*` (rotas do NextAuth)
   - `/api/inngest` (o Inngest chama esta rota por cron, sem sessão)
   - `/api/webhooks` (webhooks externos)
   - `/_next/*` (assets estáticos do Next.js)
   - `/favicon.ico`
3. Se não autenticado, redirecionar para `/login`.
4. Configurar o `matcher` para aplicar apenas às rotas necessárias.

**Estrutura do ficheiro:**

```typescript
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas — não exigem autenticação
  const publicPaths = ["/login", "/api/auth", "/api/inngest", "/api/webhooks"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

**Restrição:** NÃO usar `withAuth` wrapper do NextAuth. Usar `getToken` directamente — é mais simples e não requer configuração extra.

---

### Tarefa 1.4 — Adicionar SessionProvider ao layout

**Ficheiro a criar:** `src/components/providers.tsx`

**O que fazer:**

1. Criar um Client Component que envolve `children` com `SessionProvider` do `next-auth/react`.

```typescript
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

2. Actualizar `src/app/layout.tsx` para envolver o `body` com `<Providers>`:

```tsx
<body className={inter.className}>
  <Providers>{children}</Providers>
</body>
```

**Restrição:** NÃO alterar mais nada no layout. Apenas adicionar o wrapper.

---

### Tarefa 1.5 — Mostrar utilizador na sidebar e adicionar logout

**Ficheiro:** `src/components/layout/sidebar.tsx`

**O que fazer:**

1. Converter para `"use client"`.
2. Importar `useSession` e `signOut` de `next-auth/react`.
3. No fundo da sidebar, mostrar o nome do utilizador e um botão "Sair".
4. O botão "Sair" chama `signOut({ callbackUrl: "/login" })`.

Adicionar ao final da `<aside>`, antes do `</aside>`:

```tsx
<div className="border-t p-4">
  <p className="text-sm truncate">{session?.user?.name ?? "—"}</p>
  <button
    onClick={() => signOut({ callbackUrl: "/login" })}
    className="mt-2 text-xs text-muted-foreground hover:text-foreground"
  >
    Sair
  </button>
</div>
```

**Restrição:** NÃO alterar a navegação existente (Dashboard, Clientes, Relatórios, Configurações). Apenas adicionar o bloco de utilizador no fundo.

---

## PASSO 2 — Testes Críticos (Apenas 2)

Apenas dois testes. Nada mais. O resto valida-se com dados reais.

---

### Tarefa 2.1 — Teste do crypto.ts (encrypt/decrypt roundtrip)

**Ficheiro:** `tests/pipeline/crypto.test.ts` (renomear ou criar novo)

**O que fazer:**

Substituir o conteúdo por testes reais. Definir `ENCRYPTION_KEY` no ambiente de teste.

```typescript
import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  // Chave de teste fixa (64 hex chars = 32 bytes)
  process.env.ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

describe("crypto", () => {
  it("encrypt → decrypt retorna o texto original", async () => {
    const { encrypt, decrypt } = await import("@/lib/crypto");
    const original = "ya29.a0AfH6SMBx_fake_google_access_token_1234567890";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("texto encriptado tem formato iv:encrypted:tag", async () => {
    const { encrypt } = await import("@/lib/crypto");
    const encrypted = encrypt("test-token");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toMatch(/^[a-f0-9]{32}$/); // IV = 16 bytes = 32 hex
    expect(parts[2]).toMatch(/^[a-f0-9]{32}$/); // Tag = 16 bytes = 32 hex
  });

  it("encriptações diferentes do mesmo texto produzem resultados diferentes (IV aleatório)", async () => {
    const { encrypt } = await import("@/lib/crypto");
    const a = encrypt("same-token");
    const b = encrypt("same-token");
    expect(a).not.toBe(b); // IV diferente a cada chamada
  });

  it("decrypt com payload inválido lança erro", async () => {
    const { decrypt } = await import("@/lib/crypto");
    expect(() => decrypt("invalid-payload")).toThrow("Invalid encrypted payload format");
  });

  it("decrypt com chave errada falha", async () => {
    const { encrypt } = await import("@/lib/crypto");
    const encrypted = encrypt("secret-token");

    // Mudar a chave
    process.env.ENCRYPTION_KEY =
      "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    // Reimportar para pegar a nova chave
    // Nota: como getEncryptionKey() lê process.env a cada chamada, basta chamar decrypt
    const { decrypt } = await import("@/lib/crypto");
    expect(() => decrypt(encrypted)).toThrow();

    // Restaurar chave original
    process.env.ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });
});
```

**Restrição:** NÃO fazer mock de nada. Estes testes usam a implementação real de `crypto`.

---

### Tarefa 2.2 — Teste do calcVariation no process.ts

**Ficheiro:** `tests/pipeline/process.test.ts`

**Problema actual:** O teste só verifica se a função existe.

**O que fazer:**

A função `calcVariation` é privada (não exportada). Testar indirectamente não faz sentido sem banco. Em vez disso, **exportar** `calcVariation` do `process.ts` e testar directamente.

1. No `src/lib/pipeline/process.ts`, alterar a linha 5:

```typescript
// De:
function calcVariation(current: number, previous: number): number {
// Para:
export function calcVariation(current: number, previous: number): number {
```

2. Substituir o conteúdo de `tests/pipeline/process.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { calcVariation } from "@/lib/pipeline/process";

describe("calcVariation", () => {
  it("calcula aumento de 100 para 150 como +50%", () => {
    expect(calcVariation(150, 100)).toBe(50);
  });

  it("calcula queda de 200 para 100 como -50%", () => {
    expect(calcVariation(100, 200)).toBe(-50);
  });

  it("anterior zero e actual positivo retorna 100%", () => {
    expect(calcVariation(50, 0)).toBe(100);
  });

  it("ambos zero retorna 0%", () => {
    expect(calcVariation(0, 0)).toBe(0);
  });

  it("valores iguais retorna 0%", () => {
    expect(calcVariation(100, 100)).toBe(0);
  });

  it("calcula variação com decimais correctamente", () => {
    // 33 para 100 = +203.03%
    const result = calcVariation(100, 33);
    expect(result).toBeCloseTo(203.03, 1);
  });
});
```

**Restrição:** NÃO alterar a lógica de `calcVariation`. Apenas exportar e testar.

---

### Tarefa 2.3 — Limpar os testes stub restantes

**Ficheiros:**
- `tests/pipeline/ingest.test.ts`
- `tests/pipeline/analyze.test.ts`
- `tests/integrations/google-analytics.test.ts`
- `tests/integrations/meta-ads.test.ts`

**O que fazer:**

Apagar o conteúdo de cada ficheiro e substituir por um placeholder honesto:

```typescript
import { describe, it } from "vitest";

describe("ingest", () => {
  it.todo("validar com dados reais de cliente (teste E2E)");
});
```

Fazer o mesmo para cada ficheiro, ajustando o nome do `describe`.

**Justificação:** Testes que fazem `expect(typeof fn).toBe("function")` dão falsa confiança. Um `it.todo` é honesto — diz que o teste ainda não existe.

---

## PASSO 3 — Página de Settings Funcional

A página de settings é o ponto de entrada para configurar as credenciais OAuth de um cliente. Sem ela, não há como inserir tokens reais no sistema.

---

### Tarefa 3.1 — Criar API para actualizar integrações do cliente

**Ficheiro a criar:** `src/app/api/clients/[id]/route.ts`

**O que fazer:**

1. Criar um endpoint `PATCH` que aceita actualizações parciais de um cliente.
2. Aceitar campos: `name`, `email`, `phone`, `active`, `integrations`, `reportConfig`.
3. Quando `integrations` for enviado, **encriptar** os tokens OAuth com `encrypt()` antes de salvar.
4. Validar com Zod.

**Estrutura:**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().optional(),
  active: z.boolean().optional(),
  integrations: z
    .object({
      google: z
        .object({
          accessToken: z.string(),
          refreshToken: z.string(),
          expiresAt: z.number(),
        })
        .optional(),
      meta: z
        .object({
          accessToken: z.string(),
          expiresAt: z.number(),
        })
        .optional(),
    })
    .optional(),
  reportConfig: z
    .object({
      googlePropertyId: z.string().optional(),
      googleSiteUrl: z.string().optional(),
      metaAdAccountId: z.string().optional(),
      logo: z.string().optional(),
      primaryColor: z.string().optional(),
    })
    .optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.email !== undefined) data.email = parsed.data.email || null;
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.reportConfig !== undefined) data.reportConfig = parsed.data.reportConfig;

  // Encriptar tokens OAuth antes de salvar
  if (parsed.data.integrations) {
    const encrypted: Record<string, unknown> = {};
    if (parsed.data.integrations.google) {
      const g = parsed.data.integrations.google;
      encrypted.google = {
        accessToken: encrypt(g.accessToken),
        refreshToken: encrypt(g.refreshToken),
        expiresAt: g.expiresAt,
      };
    }
    if (parsed.data.integrations.meta) {
      const m = parsed.data.integrations.meta;
      encrypted.meta = {
        accessToken: encrypt(m.accessToken),
        expiresAt: m.expiresAt,
      };
    }
    data.integrations = encrypted;
  }

  const client = await db.client.update({ where: { id }, data });
  return NextResponse.json(client);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = await db.client.findUnique({ where: { id } });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  return NextResponse.json(client);
}
```

**Restrição:** Os tokens chegam em texto plano do formulário e são encriptados ANTES de salvar. A API NUNCA retorna tokens desencriptados — o campo `integrations` no GET retorna os valores encriptados (strings opacas).

---

### Tarefa 3.2 — Reescrever a página de settings do cliente

**Ficheiro:** `src/app/(dashboard)/clients/[id]/page.tsx`

**Problema actual:** A página mostra informações do cliente mas não permite editar integrações nem configuração de relatório.

**O que fazer:**

Adicionar à página existente (abaixo das informações e relatórios) uma secção "Integrações" com formulários para:

1. **Google (GA4 + Search Console):**
   - Campo: `googlePropertyId` (ID da propriedade GA4, ex: `properties/123456789`)
   - Campo: `googleSiteUrl` (URL do site no Search Console, ex: `https://example.com`)
   - Campo: `accessToken` (token de acesso Google)
   - Campo: `refreshToken` (refresh token Google)
   - Botão "Salvar Google"

2. **Meta Ads:**
   - Campo: `metaAdAccountId` (ID da conta de anúncios, ex: `act_123456789`)
   - Campo: `accessToken` (token de acesso Meta)
   - Botão "Salvar Meta"

Cada botão faz `PATCH /api/clients/[id]` com os dados correspondentes.

**Implementação:**

Criar um Client Component separado `src/components/clients/client-integrations.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ClientIntegrationsProps {
  clientId: string;
  reportConfig: {
    googlePropertyId?: string;
    googleSiteUrl?: string;
    metaAdAccountId?: string;
  };
  hasGoogle: boolean; // se já tem tokens Google configurados
  hasMeta: boolean;   // se já tem tokens Meta configurados
}

export function ClientIntegrations({
  clientId,
  reportConfig,
  hasGoogle,
  hasMeta,
}: ClientIntegrationsProps) {
  // Estado para Google
  const [googlePropertyId, setGooglePropertyId] = useState(reportConfig.googlePropertyId ?? "");
  const [googleSiteUrl, setGoogleSiteUrl] = useState(reportConfig.googleSiteUrl ?? "");
  const [googleAccessToken, setGoogleAccessToken] = useState("");
  const [googleRefreshToken, setGoogleRefreshToken] = useState("");

  // Estado para Meta
  const [metaAdAccountId, setMetaAdAccountId] = useState(reportConfig.metaAdAccountId ?? "");
  const [metaAccessToken, setMetaAccessToken] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveGoogle() {
    setSaving(true);
    setMessage("");
    const body: Record<string, unknown> = {
      reportConfig: { ...reportConfig, googlePropertyId, googleSiteUrl },
    };
    // Só enviar tokens se preenchidos (permite actualizar só o reportConfig)
    if (googleAccessToken && googleRefreshToken) {
      body.integrations = {
        google: {
          accessToken: googleAccessToken,
          refreshToken: googleRefreshToken,
          expiresAt: Date.now() + 3600 * 1000, // 1 hora
        },
      };
    }
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setMessage(res.ok ? "Google salvo com sucesso" : "Erro ao salvar Google");
  }

  async function saveMeta() {
    setSaving(true);
    setMessage("");
    const body: Record<string, unknown> = {
      reportConfig: { ...reportConfig, metaAdAccountId },
    };
    if (metaAccessToken) {
      body.integrations = {
        meta: {
          accessToken: metaAccessToken,
          expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 dias
        },
      };
    }
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setMessage(res.ok ? "Meta salvo com sucesso" : "Erro ao salvar Meta");
  }

  return (
    <div className="space-y-6">
      {message && (
        <p className={`text-sm ${message.includes("Erro") ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}

      {/* Google */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-medium">Google (GA4 + Search Console)</h3>
        <p className="text-xs text-muted-foreground">
          {hasGoogle ? "✓ Tokens configurados" : "✗ Tokens não configurados"}
        </p>
        <div className="grid gap-3">
          <div>
            <label className="block text-sm mb-1">Property ID (GA4)</label>
            <input type="text" value={googlePropertyId}
              onChange={(e) => setGooglePropertyId(e.target.value)}
              placeholder="properties/123456789"
              className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm mb-1">Site URL (Search Console)</label>
            <input type="text" value={googleSiteUrl}
              onChange={(e) => setGoogleSiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm mb-1">Access Token</label>
            <input type="password" value={googleAccessToken}
              onChange={(e) => setGoogleAccessToken(e.target.value)}
              placeholder={hasGoogle ? "••• (já configurado, preencha para substituir)" : "Cole o access token"}
              className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm mb-1">Refresh Token</label>
            <input type="password" value={googleRefreshToken}
              onChange={(e) => setGoogleRefreshToken(e.target.value)}
              placeholder={hasGoogle ? "••• (já configurado, preencha para substituir)" : "Cole o refresh token"}
              className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>
        <Button onClick={saveGoogle} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Google"}
        </Button>
      </div>

      {/* Meta */}
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-medium">Meta Ads</h3>
        <p className="text-xs text-muted-foreground">
          {hasMeta ? "✓ Token configurado" : "✗ Token não configurado"}
        </p>
        <div className="grid gap-3">
          <div>
            <label className="block text-sm mb-1">Ad Account ID</label>
            <input type="text" value={metaAdAccountId}
              onChange={(e) => setMetaAdAccountId(e.target.value)}
              placeholder="act_123456789"
              className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm mb-1">Access Token</label>
            <input type="password" value={metaAccessToken}
              onChange={(e) => setMetaAccessToken(e.target.value)}
              placeholder={hasMeta ? "••• (já configurado, preencha para substituir)" : "Cole o access token"}
              className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>
        <Button onClick={saveMeta} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Meta"}
        </Button>
      </div>
    </div>
  );
}
```

Depois, na página `src/app/(dashboard)/clients/[id]/page.tsx`, importar e renderizar `<ClientIntegrations>` abaixo dos relatórios:

```tsx
import { ClientIntegrations } from "@/components/clients/client-integrations";

// Dentro do JSX, após a secção de relatórios:
<div>
  <h3 className="font-medium mb-4">Integrações</h3>
  <ClientIntegrations
    clientId={client.id}
    reportConfig={(client.reportConfig ?? {}) as {
      googlePropertyId?: string;
      googleSiteUrl?: string;
      metaAdAccountId?: string;
    }}
    hasGoogle={!!(client.integrations as Record<string, unknown>)?.google}
    hasMeta={!!(client.integrations as Record<string, unknown>)?.meta}
  />
</div>
```

**Restrição:** NÃO mostrar tokens desencriptados. Os campos de token são sempre `type="password"` e começam vazios. O placeholder indica se já estão configurados.

---

### Tarefa 3.3 — Actualizar a página de settings da agência

**Ficheiro:** `src/app/(dashboard)/settings/page.tsx`

**Problema actual:** A página é um shell vazio.

**O que fazer:**

Mostrar informações úteis da agência e links para configurar clientes. NÃO criar formulários complexos — na V1, as configurações da agência (GOOGLE_CLIENT_ID, etc.) são variáveis de ambiente.

```tsx
import { Shell } from "@/components/layout/shell";
import Link from "next/link";

export default function SettingsPage() {
  const envStatus = (key: string) => !!process.env[key];

  return (
    <Shell title="Configurações">
      <div className="space-y-6 max-w-xl">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Agência</h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">AGENCY_ID</dt>
              <dd>{process.env.AGENCY_ID ? "✓ Configurado" : "✗ Falta"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Variáveis de Ambiente</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Configuradas no .env.local ou no Coolify.
          </p>
          <dl className="space-y-1 text-sm">
            {[
              ["Google OAuth", "GOOGLE_CLIENT_ID"],
              ["Meta OAuth", "META_APP_ID"],
              ["OpenAI", "OPENAI_API_KEY"],
              ["Cloudflare R2", "R2_ACCOUNT_ID"],
              ["Z-API (WhatsApp)", "ZAPI_INSTANCE_ID"],
              ["Resend (E-mail)", "RESEND_API_KEY"],
              ["Inngest", "INNGEST_EVENT_KEY"],
            ].map(([label, key]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{envStatus(key) ? "✓" : "✗"}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Integrações dos Clientes</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure tokens OAuth e IDs de propriedade na página de cada cliente.
          </p>
          <Link href="/clients" className="text-sm text-primary hover:underline mt-2 inline-block">
            Ir para Clientes →
          </Link>
        </div>
      </div>
    </Shell>
  );
}
```

**Restrição:** NÃO mostrar valores de variáveis de ambiente. Apenas indicar se estão configuradas (✓/✗).

---

## PASSO 4 — Botão de Geração Manual na Página do Cliente

### Tarefa 4.1 — Adicionar botão "Gerar Relatório" na página do cliente

**Ficheiro:** `src/app/(dashboard)/clients/[id]/page.tsx`

**O que fazer:**

Adicionar um Client Component com um botão que permite gerar um relatório manualmente para o mês anterior. Este botão:

1. Cria um Report com status PENDING via `POST /api/reports` (ou directamente)
2. Chama `POST /api/reports/[id]/generate` para disparar o pipeline via Inngest

Criar `src/components/clients/generate-report-button.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GenerateReportButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setMessage("Criando relatório...");

    // Criar o report primeiro
    const now = new Date();
    const period = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const createRes = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, period: period.toISOString() }),
    });

    if (!createRes.ok) {
      setMessage("Erro ao criar relatório");
      setLoading(false);
      return;
    }

    const report = await createRes.json();

    // Disparar geração
    const genRes = await fetch(`/api/reports/${report.id}/generate`, {
      method: "POST",
    });

    setLoading(false);
    setMessage(genRes.ok ? "Pipeline disparado! Acompanhe em Relatórios." : "Erro ao disparar geração");
  }

  return (
    <div>
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? "Gerando..." : "Gerar Relatório (mês anterior)"}
      </Button>
      {message && <p className="text-sm mt-2 text-muted-foreground">{message}</p>}
    </div>
  );
}
```

Actualizar `src/app/api/reports/route.ts` para aceitar POST (criar report):

Adicionar ao ficheiro existente:

```typescript
export async function POST(request: Request) {
  const agencyId = process.env.AGENCY_ID;
  if (!agencyId) {
    return NextResponse.json({ error: "AGENCY_ID not configured" }, { status: 500 });
  }
  const body = await request.json();
  const { clientId, period } = body;
  if (!clientId || !period) {
    return NextResponse.json({ error: "clientId and period required" }, { status: 400 });
  }
  const report = await db.report.upsert({
    where: { clientId_period: { clientId, period: new Date(period) } },
    create: { clientId, agencyId, period: new Date(period), status: "PENDING" },
    update: { status: "PENDING", errorMessage: null },
  });
  return NextResponse.json(report);
}
```

Renderizar o botão na página do cliente, acima dos relatórios.

---

## VERIFICAÇÃO FINAL

Após completar todas as tarefas, executar:

```bash
npm run build
npm run test
```

O build DEVE compilar sem erros.
Os testes DEVEM passar (5 testes de crypto + 6 de calcVariation + 3 todo placeholders).

Depois, para o teste E2E real:
1. Configurar `.env.local` com credenciais reais (Neon DB, ENCRYPTION_KEY, AGENCY_ID)
2. Executar `npm run db:push && npm run db:seed`
3. Executar `npm run dev`
4. Fazer login com `admin@metria.com` / `admin123`
5. Ir a um cliente e configurar tokens OAuth reais
6. Clicar "Gerar Relatório" e acompanhar o status

**NÃO alterar ficheiros do pipeline (`src/lib/pipeline/*`, `src/lib/integrations/*`).**
**NÃO alterar o `prisma/schema.prisma`.**
