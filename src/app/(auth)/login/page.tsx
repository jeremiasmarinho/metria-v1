"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
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
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main className="flex min-h-screen w-full">
      {/* Lado esquerdo - Marca */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary to-accent p-12 flex-col justify-between text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary font-bold text-xl">
            M
          </div>
          <span className="font-semibold text-2xl tracking-tight">Metria</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Relatórios de marketing no piloto automático
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Conecte as fontes de dados, gere insights com inteligência artificial e entregue resultados recorrentes para seus clientes.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} Metria B2B.
        </div>
      </div>

      {/* Lado direito - Login */}
      <div className="flex flex-1 flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-2">
            <div className="flex lg:hidden items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
                M
              </div>
              <span className="font-semibold text-2xl tracking-tight">Metria</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground">
              Insira suas credenciais para acessar o painel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@metria.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
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
        </div>
      </div>
    </main>
  );
}
