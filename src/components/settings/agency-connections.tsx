"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2, ExternalLink, List, AlertCircle } from "lucide-react";
import { notify } from "@/lib/ui-feedback";

interface OAuthStatus {
  google: boolean;
  meta: boolean;
}

interface Connection {
  id: string;
  provider: "GOOGLE" | "META";
  status: "CONNECTED" | "DISCONNECTED";
  expiresAt: string | null;
  connectedAt: string;
}

interface MetaAccount {
  id: string;
  name: string;
  accountStatus: number;
}

interface GoogleAccount {
  id: string;
  customerId: string;
  descriptiveName?: string;
}

export function AgencyConnections() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountsModal, setAccountsModal] = useState<"meta" | "google" | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [metaAccounts, setMetaAccounts] = useState<MetaAccount[]>([]);
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([]);

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    const success = searchParams.get("oauth_success");
    const error = searchParams.get("oauth_error");
    if (success) {
      fetchConnections();
      notify({
        variant: "success",
        title: "Conectado",
        description:
          success === "meta"
            ? "Conta Meta Business conectada com sucesso."
            : "Conta Google Ads conectada com sucesso.",
      });
      window.history.replaceState({}, "", "/settings");
    }
    if (error) {
      const [provider, msg] = error.split(":");
      notify({
        variant: "error",
        title: "Erro na conexão",
        description: `Não foi possível conectar ${provider}: ${decodeURIComponent(msg || error)}`,
      });
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams]);

  async function fetchConnections() {
    setLoading(true);
    try {
      const [connRes, oauthRes] = await Promise.all([
        fetch("/api/agency/connections"),
        fetch("/api/agency/oauth-status"),
      ]);
      if (connRes.ok) {
        const data = (await connRes.json()) as Connection[];
        setConnections(data);
      }
      if (oauthRes.ok) {
        const data = (await oauthRes.json()) as OAuthStatus;
        setOauthStatus(data);
      }
    } catch {
      notify({ variant: "error", title: "Erro", description: "Não foi possível carregar conexões." });
    } finally {
      setLoading(false);
    }
  }

  async function fetchMetaAccounts() {
    setAccountsModal("meta");
    setAccountsLoading(true);
    setMetaAccounts([]);
    try {
      const res = await fetch("/api/agency/connections/meta/accounts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao listar contas");
      setMetaAccounts(data.accounts ?? []);
    } catch (err) {
      notify({
        variant: "error",
        title: "Erro ao listar contas Meta",
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setAccountsLoading(false);
    }
  }

  async function fetchGoogleAccounts() {
    setAccountsModal("google");
    setAccountsLoading(true);
    setGoogleAccounts([]);
    try {
      const res = await fetch("/api/agency/connections/google/accounts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao listar contas");
      setGoogleAccounts(data.accounts ?? []);
    } catch (err) {
      notify({
        variant: "error",
        title: "Erro ao listar contas Google Ads",
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setAccountsLoading(false);
    }
  }

  const metaConn = connections.find((c) => c.provider === "META");
  const googleConn = connections.find((c) => c.provider === "GOOGLE");
  const hasMeta = !!metaConn;
  const hasGoogle = !!googleConn;
  const metaDisconnected = metaConn?.status === "DISCONNECTED";
  const googleDisconnected = googleConn?.status === "DISCONNECTED";

  return (
    <>
      <Card className="app-enter app-enter-delay-2 col-span-full rounded-2xl border-border/70 shadow-md transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Conectar conta pai</CardTitle>
              <CardDescription>
                Um clique para conectar Meta Business ou Google Ads (MCC). Depois, vincule as sub-contas aos clientes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-[#0668E1]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    <span className="font-semibold">Meta Business</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      metaDisconnected
                        ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15"
                        : hasMeta
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15"
                          : "border-muted-foreground/30"
                    }
                  >
                    {metaDisconnected ? (
                      <><XCircle className="mr-1 h-3 w-3" /> Desconectado</>
                    ) : hasMeta ? (
                      <><CheckCircle2 className="mr-1 h-3 w-3" /> Conectado</>
                    ) : (
                      <><XCircle className="mr-1 h-3 w-3" /> Não conectado</>
                    )}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  {!oauthStatus?.meta ? (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Configuração necessária</p>
                        <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                          O administrador deve configurar META_APP_ID e META_APP_SECRET. Consulte{" "}
                          <Link href="/docs/setup" className="underline hover:no-underline">
                            guia de instalação
                          </Link>.
                        </p>
                      </div>
                    </div>
                  ) : hasMeta ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchMetaAccounts}
                        disabled={accountsLoading}
                        className="rounded-xl"
                      >
                        {accountsLoading && accountsModal === "meta" ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <List className="mr-2 h-3.5 w-3.5" />
                        )}
                        Ver contas
                      </Button>
                      <a
                        href="/api/oauth/meta/authorize"
                        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-xl")}
                      >
                        Reconectar <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <a
                      href="/api/oauth/meta/authorize"
                      className={cn(buttonVariants({ size: "sm" }), "rounded-xl inline-flex items-center")}
                    >
                      Conectar com Meta Business <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="font-semibold">Google Ads</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      googleDisconnected
                        ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15"
                        : hasGoogle
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15"
                          : "border-muted-foreground/30"
                    }
                  >
                    {googleDisconnected ? (
                      <><XCircle className="mr-1 h-3 w-3" /> Desconectado</>
                    ) : hasGoogle ? (
                      <><CheckCircle2 className="mr-1 h-3 w-3" /> Conectado</>
                    ) : (
                      <><XCircle className="mr-1 h-3 w-3" /> Não conectado</>
                    )}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  {!oauthStatus?.google ? (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Configuração necessária</p>
                        <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                          O administrador deve configurar GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET. Consulte{" "}
                          <Link href="/docs/setup" className="underline hover:no-underline">
                            guia de instalação
                          </Link>.
                        </p>
                      </div>
                    </div>
                  ) : hasGoogle ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchGoogleAccounts}
                        disabled={accountsLoading}
                        className="rounded-xl"
                      >
                        {accountsLoading && accountsModal === "google" ? (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <List className="mr-2 h-3.5 w-3.5" />
                        )}
                        Ver contas
                      </Button>
                      <a
                        href="/api/oauth/google/authorize"
                        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-xl")}
                      >
                        Reconectar <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <a
                      href="/api/oauth/google/authorize"
                      className={cn(buttonVariants({ size: "sm" }), "rounded-xl inline-flex items-center")}
                    >
                      Conectar com Google Ads <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal lista de contas */}
      {accountsModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            onClick={() => setAccountsModal(null)}
            aria-label="Fechar"
          />
          <div className="relative max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl">
            <div className="border-b border-border/70 p-4">
              <h3 className="font-semibold">
                {accountsModal === "meta" ? "Contas de anúncios Meta" : "Contas Google Ads acessíveis"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Estes IDs podem ser vinculados aos clientes na página de cada cliente.
              </p>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-4">
              {accountsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : accountsModal === "meta" ? (
                metaAccounts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Nenhuma conta de anúncios encontrada.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {metaAccounts.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.id}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              ) : googleAccounts.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma conta acessível ou token inválido. Configure GOOGLE_ADS_DEVELOPER_TOKEN se necessário.
                </p>
              ) : (
                <ul className="space-y-2">
                  {googleAccounts.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{a.descriptiveName ?? a.customerId}</p>
                        <p className="text-xs text-muted-foreground">{a.customerId}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-border/70 p-4">
              <Button variant="outline" size="sm" onClick={() => setAccountsModal(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
