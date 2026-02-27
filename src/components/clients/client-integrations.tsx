"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { notify } from "@/lib/ui-feedback";

interface ClientIntegrationsProps {
  clientId: string;
  reportConfig: {
    googlePropertyId?: string;
    googleSiteUrl?: string;
    metaAdAccountId?: string;
  };
  hasGoogle: boolean;
  hasMeta: boolean;
}

export function ClientIntegrations({
  clientId,
  reportConfig,
  hasGoogle,
  hasMeta,
}: ClientIntegrationsProps) {
  const [googlePropertyId, setGooglePropertyId] = useState(
    reportConfig.googlePropertyId ?? ""
  );
  const [googleSiteUrl, setGoogleSiteUrl] = useState(
    reportConfig.googleSiteUrl ?? ""
  );
  const [googleAccessToken, setGoogleAccessToken] = useState("");
  const [googleRefreshToken, setGoogleRefreshToken] = useState("");

  const [metaAdAccountId, setMetaAdAccountId] = useState(
    reportConfig.metaAdAccountId ?? ""
  );
  const [metaAccessToken, setMetaAccessToken] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [showGoogleTokens, setShowGoogleTokens] = useState(false);
  const [showMetaTokens, setShowMetaTokens] = useState(false);

  async function saveGoogle() {
    setSaving(true);
    setMessage("");
    const body: Record<string, unknown> = {
      reportConfig: { ...reportConfig, googlePropertyId, googleSiteUrl },
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
              Conecte GA4 e Search Console para consolidar tráfego, aquisição e demanda orgânica.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Input
                id="metaAdAccountId"
                type="text"
                value={metaAdAccountId}
                onChange={(e) => setMetaAdAccountId(e.target.value)}
                placeholder="act_123456789"
              />
            </div>
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
            <Button onClick={saveMeta} disabled={saving} className="mt-2 w-full rounded-xl shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar Meta"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
