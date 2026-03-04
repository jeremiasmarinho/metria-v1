"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff, Link2, Search, AlertCircle, Target } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { notify } from "@/lib/ui-feedback";

type AccountWithLinked = {
  id: string;
  name?: string;
  customerId?: string;
  descriptiveName?: string;
  linkedToClient?: { id: string; name: string };
};

interface ClientIntegrationsProps {
  clientId: string;
  reportConfig: {
    googlePropertyId?: string;
    googleSiteUrl?: string;
    metaAdAccountId?: string;
    trackingPreferences?: {
      ga4IntentEvents?: string[];
      ga4ConversionEvents?: string[];
      metaConversionEvents?: string[];
    };
  };
  metaAdAccountId?: string | null;
  googleAdsCustomerId?: string | null;
  hasGoogle: boolean;
  hasMeta: boolean;
  /** Quando true, o token Meta vem da agência — esconder campo de token. */
  metaUsesAgency?: boolean;
  /** Quando true, o token Google vem da agência — esconder campos de token. */
  googleUsesAgency?: boolean;
  openLinkModalOnMount?: "meta" | "google";
}

export function ClientIntegrations({
  clientId,
  reportConfig,
  metaAdAccountId: initialMetaAdAccountId,
  googleAdsCustomerId: initialGoogleAdsCustomerId,
  hasGoogle,
  hasMeta,
  metaUsesAgency = false,
  googleUsesAgency = false,
  openLinkModalOnMount,
}: ClientIntegrationsProps) {
  const router = useRouter();
  const [googlePropertyId, setGooglePropertyId] = useState(
    reportConfig.googlePropertyId ?? ""
  );
  const [googleSiteUrl, setGoogleSiteUrl] = useState(
    reportConfig.googleSiteUrl ?? ""
  );
  const [googleAccessToken, setGoogleAccessToken] = useState("");
  const [googleRefreshToken, setGoogleRefreshToken] = useState("");

  const [metaAdAccountId, setMetaAdAccountId] = useState(
    initialMetaAdAccountId ?? reportConfig.metaAdAccountId ?? ""
  );
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [googleAdsCustomerId, setGoogleAdsCustomerId] = useState(
    initialGoogleAdsCustomerId ?? ""
  );

  const [linkModal, setLinkModal] = useState<"meta" | "google" | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [metaAccounts, setMetaAccounts] = useState<AccountWithLinked[]>([]);
  const [googleAccounts, setGoogleAccounts] = useState<AccountWithLinked[]>([]);
  const [linkSearch, setLinkSearch] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [showGoogleTokens, setShowGoogleTokens] = useState(false);
  const [showMetaTokens, setShowMetaTokens] = useState(false);

  const tp = reportConfig.trackingPreferences ?? {};
  const [ga4Intent, setGa4Intent] = useState<string[]>(tp.ga4IntentEvents ?? []);
  const [ga4Conversion, setGa4Conversion] = useState<string[]>(tp.ga4ConversionEvents ?? []);
  const [metaConversion, setMetaConversion] = useState<string[]>(tp.metaConversionEvents ?? []);

  const GA4_INTENT_OPTIONS = [
    { value: "clique_whatsapp", label: "Clique no WhatsApp" },
    { value: "link_click", label: "Clique em link" },
  ] as const;
  const GA4_CONVERSION_OPTIONS = [
    { value: "lead_typebot", label: "Lead Typebot" },
    { value: "form_submit", label: "Envio de formulário" },
    { value: "diagnostico_complete", label: "Diagnóstico completo" },
  ] as const;
  const META_CONVERSION_OPTIONS = [
    { value: "lead", label: "Lead" },
    { value: "message", label: "Mensagem" },
    { value: "purchase", label: "Compra" },
  ] as const;

  function toggleInArray(setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) {
    setter((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value]
    );
  }

  const hasAnyEvent = ga4Intent.length > 0 || ga4Conversion.length > 0 || metaConversion.length > 0;
  const [savingKpi, setSavingKpi] = useState(false);

  async function saveTrackingPreferences() {
    setSavingKpi(true);
    setMessage("");
    const body = {
      reportConfig: {
        ...reportConfig,
        trackingPreferences: {
          ga4IntentEvents: ga4Intent,
          ga4ConversionEvents: ga4Conversion,
          metaConversionEvents: metaConversion,
        },
      },
    };
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSavingKpi(false);
    if (res.ok) {
      router.refresh();
      notify({
        variant: "success",
        title: "Mapeamento salvo",
        description: "Eventos de intenção e conversão foram atualizados.",
      });
    } else {
      notify({
        variant: "error",
        title: "Erro ao salvar",
        description: "Não foi possível salvar o mapeamento de KPIs.",
      });
    }
  }

  async function saveGoogle() {
    setSaving(true);
    setMessage("");
    const body: Record<string, unknown> = {
      reportConfig: { ...reportConfig, googlePropertyId, googleSiteUrl },
      googleAdsCustomerId: googleAdsCustomerId || null,
    };
    if (googleAccessToken && googleRefreshToken) {
      body.integrations = {
        google: {
          accessToken: googleAccessToken,
          refreshToken: googleRefreshToken,
          expiresAt: Date.now() + 3600 * 1000,
        },
      };
    }
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setMessage(res.ok ? "Integrações do Google atualizadas." : "Não foi possível salvar as integrações do Google.");
    notify({
      variant: res.ok ? "success" : "error",
      title: res.ok ? "Google conectado" : "Erro ao salvar Google",
      description: res.ok
        ? "Configurações e credenciais foram salvas com segurança."
        : "Revise os campos e tente novamente.",
    });
  }

  async function linkMetaAccount(accountId: string) {
    setLinkLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaAdAccountId: accountId,
          reportConfig: { ...reportConfig, metaAdAccountId: accountId },
        }),
      });
      if (!res.ok) throw new Error("Erro ao vincular");
      setMetaAdAccountId(accountId);
      setLinkModal(null);
      router.refresh();
      notify({ variant: "success", title: "Conta Meta vinculada", description: "A conta foi associada a este cliente." });
    } catch {
      notify({ variant: "error", title: "Erro", description: "Não foi possível vincular a conta." });
    } finally {
      setLinkLoading(false);
    }
  }

  async function linkGoogleAccount(customerId: string) {
    setLinkLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleAdsCustomerId: customerId }),
      });
      if (!res.ok) throw new Error("Erro ao vincular");
      setGoogleAdsCustomerId(customerId);
      setLinkModal(null);
      router.refresh();
      notify({ variant: "success", title: "Conta Google Ads vinculada", description: "A conta foi associada a este cliente." });
    } catch {
      notify({ variant: "error", title: "Erro", description: "Não foi possível vincular a conta." });
    } finally {
      setLinkLoading(false);
    }
  }

  async function openLinkModal(provider: "meta" | "google") {
    setLinkLoading(true);
    try {
      const connRes = await fetch("/api/agency/connections");
      if (!connRes.ok) throw new Error("Erro ao verificar conexões");
      const connections = (await connRes.json()) as { provider: string; status: string }[];
      const conn = connections.find((c) => c.provider === (provider === "meta" ? "META" : "GOOGLE"));
      if (!conn || conn.status === "DISCONNECTED") {
        router.push("/settings?message=" + encodeURIComponent("Conecte sua conta de Agência primeiro."));
        notify({
          variant: "error",
          title: "Agência não conectada",
          description: "Conecte sua conta " + (provider === "meta" ? "Meta" : "Google Ads") + " nas Configurações.",
        });
        setLinkLoading(false);
        return;
      }
    } catch {
      setLinkLoading(false);
      return;
    }

    setLinkModal(provider);
    setLinkSearch("");
    setMetaAccounts([]);
    setGoogleAccounts([]);
    setLinkLoading(true);
    try {
      const base = `/api/agency/connections/${provider === "meta" ? "meta" : "google"}/accounts`;
      const res = await fetch(`${base}?clientId=${encodeURIComponent(clientId)}`);
      const data = (await res.json()) as { accounts?: AccountWithLinked[]; error?: string; code?: string };
      if (!res.ok) {
        const msg = data.error || "Erro ao listar";
        if (data.code === "TOKEN_EXPIRED" || data.code === "AGENCY_NOT_CONNECTED") {
          router.push("/settings?message=" + encodeURIComponent(msg));
        }
        throw new Error(msg);
      }
      if (provider === "meta") {
        setMetaAccounts(data.accounts ?? []);
      } else {
        setGoogleAccounts(data.accounts ?? []);
      }
    } catch (err) {
      notify({
        variant: "error",
        title: "Erro ao listar contas",
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
      setLinkModal(null);
    } finally {
      setLinkLoading(false);
    }
  }

  const filteredMetaAccounts = useMemo(() => {
    if (!linkSearch.trim()) return metaAccounts;
    const q = linkSearch.toLowerCase().trim();
    return metaAccounts.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.id?.toLowerCase().includes(q)
    );
  }, [metaAccounts, linkSearch]);

  const filteredGoogleAccounts = useMemo(() => {
    if (!linkSearch.trim()) return googleAccounts;
    const q = linkSearch.toLowerCase().trim();
    return googleAccounts.filter(
      (a) =>
        (a.descriptiveName ?? a.customerId ?? "").toLowerCase().includes(q) ||
        (a.customerId ?? a.id ?? "").toLowerCase().includes(q)
    );
  }, [googleAccounts, linkSearch]);

  useEffect(() => {
    if (openLinkModalOnMount) {
      openLinkModal(openLinkModalOnMount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openLinkModalOnMount]);

  useEffect(() => {
    const next = reportConfig.trackingPreferences ?? {};
    setGa4Intent(next.ga4IntentEvents ?? []);
    setGa4Conversion(next.ga4ConversionEvents ?? []);
    setMetaConversion(next.metaConversionEvents ?? []);
  }, [reportConfig.trackingPreferences]);

  async function saveMeta() {
    setSaving(true);
    setMessage("");
    const body: Record<string, unknown> = {
      reportConfig: { ...reportConfig, metaAdAccountId },
      metaAdAccountId: metaAdAccountId || null,
    };
    if (metaAccessToken) {
      body.integrations = {
        meta: {
          accessToken: metaAccessToken,
          expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000,
        },
      };
    }
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setMessage(res.ok ? "Integrações da Meta atualizadas." : "Não foi possível salvar as integrações da Meta.");
    notify({
      variant: res.ok ? "success" : "error",
      title: res.ok ? "Meta conectada" : "Erro ao salvar Meta",
      description: res.ok
        ? "Configurações e credenciais foram salvas com segurança."
        : "Revise os campos e tente novamente.",
    });
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`flex items-center gap-3 rounded-xl p-4 shadow-sm transition-all duration-300 ease-in-out ${
          message.includes("Erro") 
            ? "bg-destructive/10 text-destructive border border-destructive/20" 
            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {message.includes("Erro") ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Google Card */}
        <Card className="rounded-2xl border-border/70 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <CardTitle className="text-lg">Google</CardTitle>
              </div>
              <Badge variant="outline" className={`transition-all duration-300 ease-in-out ${hasGoogle ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"}`}>
                {hasGoogle ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" /> Configurado</>
                ) : (
                  <><XCircle className="w-3 h-3 mr-1" /> Não configurado</>
                )}
              </Badge>
            </div>
            <CardDescription>
              Conecte GA4, Search Console e Google Ads (MCC) para consolidar tráfego e mídia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="googleAdsCustomerId">Conta Google Ads (xxx-xxx-xxxx)</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="googleAdsCustomerId"
                  type="text"
                  value={googleAdsCustomerId}
                  onChange={(e) => setGoogleAdsCustomerId(e.target.value)}
                  placeholder="123-456-7890"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant={!googleAdsCustomerId ? "default" : "outline"}
                  size="sm"
                  onClick={() => openLinkModal("google")}
                  disabled={linkLoading}
                  className={`shrink-0 ${!googleAdsCustomerId ? "ring-2 ring-primary/30" : ""}`}
                  title="Vincular conta da agência"
                >
                  {linkLoading && linkModal === "google" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><Link2 className="mr-1 h-3.5 w-3.5" /> Vincular da agência</>
                  )}
                </Button>
              </div>
              {!googleAdsCustomerId && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Vincule uma conta da agência para usar os dados automaticamente.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="googlePropertyId">ID da propriedade (GA4)</Label>
              <Input
                id="googlePropertyId"
                type="text"
                value={googlePropertyId}
                onChange={(e) => setGooglePropertyId(e.target.value)}
                placeholder="properties/123456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="googleSiteUrl">URL do site (Search Console)</Label>
              <Input
                id="googleSiteUrl"
                type="text"
                value={googleSiteUrl}
                onChange={(e) => setGoogleSiteUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            {!googleUsesAgency && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="googleAccessToken">Token de acesso</Label>
                  <div className="relative">
                    <Input
                      id="googleAccessToken"
                      type={showGoogleTokens ? "text" : "password"}
                      value={googleAccessToken}
                      onChange={(e) => setGoogleAccessToken(e.target.value)}
                      placeholder={hasGoogle ? "••••••••••••••••••••••••" : "Cole o token de acesso"}
                      className="pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowGoogleTokens(!showGoogleTokens)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-muted-foreground transition-all duration-300 ease-in-out hover:text-foreground"
                    >
                      {showGoogleTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleRefreshToken">Token de atualização</Label>
                  <div className="relative">
                    <Input
                      id="googleRefreshToken"
                      type={showGoogleTokens ? "text" : "password"}
                      value={googleRefreshToken}
                      onChange={(e) => setGoogleRefreshToken(e.target.value)}
                      placeholder={hasGoogle ? "••••••••••••••••••••••••" : "Cole o token de atualização"}
                      className="pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowGoogleTokens(!showGoogleTokens)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-muted-foreground transition-all duration-300 ease-in-out hover:text-foreground"
                    >
                      {showGoogleTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}
            {googleUsesAgency && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Token gerenciado pela conexão da agência.
              </p>
            )}
            <Button onClick={saveGoogle} disabled={saving} className="mt-2 w-full rounded-xl shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar Google"}
            </Button>
          </CardContent>
        </Card>

        {/* Meta Card */}
        <Card className="rounded-2xl border-border/70 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#0668E1]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <CardTitle className="text-lg">Meta Ads</CardTitle>
              </div>
              <Badge variant="outline" className={`transition-all duration-300 ease-in-out ${hasMeta ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-muted text-muted-foreground"}`}>
                {hasMeta ? (
                  <><CheckCircle2 className="w-3 h-3 mr-1" /> Configurado</>
                ) : (
                  <><XCircle className="w-3 h-3 mr-1" /> Não configurado</>
                )}
              </Badge>
            </div>
            <CardDescription>
              Conecte Meta Ads para acompanhar investimento, alcance e eficiência de mídia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaAdAccountId">ID da conta de anúncios</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="metaAdAccountId"
                  type="text"
                  value={metaAdAccountId}
                  onChange={(e) => setMetaAdAccountId(e.target.value)}
                  placeholder="act_123456789"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant={!metaAdAccountId ? "default" : "outline"}
                  size="sm"
                  onClick={() => openLinkModal("meta")}
                  disabled={linkLoading}
                  className={`shrink-0 ${!metaAdAccountId ? "ring-2 ring-primary/30" : ""}`}
                  title="Vincular conta da agência"
                >
                  {linkLoading && linkModal === "meta" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><Link2 className="mr-1 h-3.5 w-3.5" /> Vincular da agência</>
                  )}
                </Button>
              </div>
              {!metaAdAccountId && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Vincule uma conta da agência para usar os dados automaticamente.
                </p>
              )}
            </div>
            {!metaUsesAgency && (
              <div className="space-y-2">
                <Label htmlFor="metaAccessToken">Token de acesso</Label>
                <div className="relative">
                  <Input
                    id="metaAccessToken"
                    type={showMetaTokens ? "text" : "password"}
                    value={metaAccessToken}
                    onChange={(e) => setMetaAccessToken(e.target.value)}
                    placeholder={hasMeta ? "••••••••••••••••••••••••" : "Cole o token de acesso"}
                    className="pr-10"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowMetaTokens(!showMetaTokens)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-muted-foreground transition-all duration-300 ease-in-out hover:text-foreground"
                  >
                    {showMetaTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            {metaUsesAgency && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Token gerenciado pela conexão da agência.
              </p>
            )}
            <Button onClick={saveMeta} disabled={saving} className="mt-2 w-full rounded-xl shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar Meta"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Mapeamento de KPIs (Eventos Estratégicos) */}
      <Card className="rounded-2xl border-border/70 shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Mapeamento de KPIs (Eventos Estratégicos)</CardTitle>
          </div>
          <CardDescription>
            Selecione os eventos de GA4 e Meta que representam intenção e conversão real. A IA usará estes dados para calcular Custo por Lead e diagnósticos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasAnyEvent && (
            <p className="text-sm text-amber-600 dark:text-amber-500 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Sem eventos selecionados, a IA não conseguirá calcular o Custo por Lead.
            </p>
          )}

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <Label className="text-base font-medium">GA4 – Intenção</Label>
              <div className="space-y-2">
                {GA4_INTENT_OPTIONS.map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ga4-intent-${value}`}
                      checked={ga4Intent.includes(value)}
                      onCheckedChange={() => toggleInArray(setGa4Intent, value)}
                    />
                    <label
                      htmlFor={`ga4-intent-${value}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">GA4 – Conversão</Label>
              <div className="space-y-2">
                {GA4_CONVERSION_OPTIONS.map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ga4-conv-${value}`}
                      checked={ga4Conversion.includes(value)}
                      onCheckedChange={() => toggleInArray(setGa4Conversion, value)}
                    />
                    <label
                      htmlFor={`ga4-conv-${value}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Meta – Conversão</Label>
              <div className="space-y-2">
                {META_CONVERSION_OPTIONS.map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`meta-conv-${value}`}
                      checked={metaConversion.includes(value)}
                      onCheckedChange={() => toggleInArray(setMetaConversion, value)}
                    />
                    <label
                      htmlFor={`meta-conv-${value}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={saveTrackingPreferences}
            disabled={savingKpi}
            className="w-full rounded-xl shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md md:w-auto"
          >
            {savingKpi ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
            ) : (
              "Salvar mapeamento de KPIs"
            )}
          </Button>
        </CardContent>
      </Card>

      {linkModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            onClick={() => setLinkModal(null)}
            aria-label="Fechar"
          />
          <div className="relative max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl">
            <div className="border-b border-border/70 p-4 space-y-3">
              <h3 className="font-semibold">
                {linkModal === "meta" ? "Vincular conta Meta" : "Vincular conta Google Ads"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Selecione a conta para associar a este cliente.
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nome ou ID..."
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-4">
              {linkLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : linkModal === "meta" ? (
                metaAccounts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Nenhuma conta encontrada. Conecte a Meta na página de Configurações.
                  </p>
                ) : filteredMetaAccounts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Nenhum resultado para &quot;{linkSearch}&quot;
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {filteredMetaAccounts.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.id}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {a.linkedToClient && (
                            <Badge variant="secondary" className="text-xs">
                              Já vinculado
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            onClick={() => linkMetaAccount(a.id)}
                            disabled={linkLoading}
                          >
                            Vincular
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              ) : googleAccounts.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhuma conta encontrada. Conecte o Google Ads na página de Configurações.
                </p>
              ) : filteredGoogleAccounts.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhum resultado para &quot;{linkSearch}&quot;
                </p>
              ) : (
                <ul className="space-y-2">
                  {filteredGoogleAccounts.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{a.descriptiveName ?? a.customerId}</p>
                        <p className="text-xs text-muted-foreground">{a.customerId}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {a.linkedToClient && (
                          <Badge variant="secondary" className="text-xs">
                            Já vinculado
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          onClick={() => linkGoogleAccount(a.customerId ?? a.id)}
                          disabled={linkLoading}
                        >
                          Vincular
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-border/70 p-4">
              <Button variant="outline" size="sm" onClick={() => setLinkModal(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
