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
    <main className="flex min-h-screen w-full bg-[#060A12] text-white">
      <div className="relative hidden w-1/2 overflow-hidden lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.45),transparent_42%),radial-gradient(circle_at_85%_80%,rgba(14,165,233,0.28),transparent_45%),linear-gradient(135deg,#0A1020,#0B1428)]" />
        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          <div className="animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3 duration-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-lg font-bold text-slate-900 shadow-sm">
              M
            </div>
            <span className="text-2xl font-semibold tracking-tight">Metria</span>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 max-w-xl space-y-5 duration-700">
            <h1 className="text-4xl font-semibold tracking-tight text-balance">
              Decisoes mais rapidas. Relatorios mais inteligentes. Crescimento previsivel.
            </h1>
            <p className="max-w-md text-base text-slate-200/90">
              "Depois do METRIA, reduzimos o tempo de consolidacao mensal em 82% e ganhamos
              clareza para otimizar investimento em cada canal."
            </p>
            <p className="text-sm text-slate-300">Diretora de Marketing, Clinica Aurora</p>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 inline-flex w-fit items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-slate-200 backdrop-blur-sm duration-700">
            <Quote className="h-3.5 w-3.5" />
            Plataforma para operacao de marketing orientada por dados
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.18),transparent_40%)]" />
        <div className="animate-in fade-in slide-in-from-bottom-4 relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-background/80 p-7 shadow-2xl backdrop-blur-sm duration-700">
          <div className="mb-7 space-y-2 text-center sm:text-left">
            <div className="mb-4 flex items-center justify-center gap-3 sm:justify-start lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-lg font-bold text-slate-900 shadow-sm">
                M
              </div>
              <span className="text-2xl font-semibold tracking-tight text-white">Metria</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Bem-vindo de volta</h2>
            <p className="text-sm text-slate-300">
              Entre com suas credenciais para acessar o painel de inteligencia.
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
                <Label htmlFor="email" className="text-slate-200">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@metria.com"
                  required
                  className="h-11 border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/50"
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

          <p className="mt-5 text-center text-xs text-slate-400 sm:text-left">
            Acesso protegido por autenticacao e controle de sessao.
          </p>
        </div>
      </div>
    </main>
  );
}
