"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    if (result?.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <main className="flex min-h-screen w-full bg-zinc-100 dark:bg-zinc-950">
      <div className="relative hidden w-1/2 overflow-hidden lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.45),transparent_42%),radial-gradient(circle_at_85%_80%,rgba(14,165,233,0.28),transparent_45%),linear-gradient(135deg,#111827,#09090b)]" />
        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3 duration-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-lg font-bold text-slate-900 shadow-sm">
              M
            </div>
            <span className="text-2xl font-semibold tracking-tight text-slate-200/90" >Metria</span>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 max-w-xl space-y-5 duration-700">
            <h1 className="text-4xl font-semibold tracking-tight text-balance text-slate-200/90">
              Decisões mais rápidas. Relatórios mais inteligentes. Crescimento previsível.
            </h1>
            
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 inline-flex w-fit items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-slate-200 backdrop-blur-sm duration-700">
            <Quote className="h-3.5 w-3.5" />
            Plataforma para operação de marketing orientada por dados
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.12),transparent_42%)]" />
        <div className="animate-in fade-in slide-in-from-bottom-4 relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-xl duration-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
          <div className="mb-7 space-y-2 text-center sm:text-left">
            <div className="mb-4 flex items-center justify-center gap-3 sm:justify-start lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-lg font-bold text-slate-900 shadow-sm">
                M
              </div>
              <span className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Metria</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Bem-vindo de volta</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Entre com suas credenciais para acessar seu painel de performance.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-800 dark:text-zinc-200">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@metria.com"
                  required
                  className="h-12 border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-primary/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-800 dark:text-zinc-200">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-primary/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-primary text-primary-foreground transition-all hover:scale-[1.02] hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-400 sm:text-left">
            Acesso protegido por autenticação e controle de sessão.
          </p>
        </div>
      </div>
    </main>
  );
}
