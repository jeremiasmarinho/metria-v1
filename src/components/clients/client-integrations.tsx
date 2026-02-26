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
    setMessage(res.ok ? "Meta salvo com sucesso" : "Erro ao salvar Meta");
  }

  return (
    <div className="space-y-6">
      {message && (
        <p
          className={`text-sm ${message.includes("Erro") ? "text-red-600" : "text-green-600"}`}
        >
          {message}
        </p>
      )}

      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-medium">Google (GA4 + Search Console)</h3>
        <p className="text-xs text-muted-foreground">
          {hasGoogle ? "✓ Tokens configurados" : "✗ Tokens não configurados"}
        </p>
        <div className="grid gap-3">
          <div>
            <label className="block text-sm mb-1">Property ID (GA4)</label>
            <input
              type="text"
              value={googlePropertyId}
              onChange={(e) => setGooglePropertyId(e.target.value)}
              placeholder="properties/123456789"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Site URL (Search Console)</label>
            <input
              type="text"
              value={googleSiteUrl}
              onChange={(e) => setGoogleSiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Access Token</label>
            <input
              type="password"
              value={googleAccessToken}
              onChange={(e) => setGoogleAccessToken(e.target.value)}
              placeholder={
                hasGoogle
                  ? "••• (já configurado, preencha para substituir)"
                  : "Cole o access token"
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Refresh Token</label>
            <input
              type="password"
              value={googleRefreshToken}
              onChange={(e) => setGoogleRefreshToken(e.target.value)}
              placeholder={
                hasGoogle
                  ? "••• (já configurado, preencha para substituir)"
                  : "Cole o refresh token"
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>
        <Button onClick={saveGoogle} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Google"}
        </Button>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-medium">Meta Ads</h3>
        <p className="text-xs text-muted-foreground">
          {hasMeta ? "✓ Token configurado" : "✗ Token não configurado"}
        </p>
        <div className="grid gap-3">
          <div>
            <label className="block text-sm mb-1">Ad Account ID</label>
            <input
              type="text"
              value={metaAdAccountId}
              onChange={(e) => setMetaAdAccountId(e.target.value)}
              placeholder="act_123456789"
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Access Token</label>
            <input
              type="password"
              value={metaAccessToken}
              onChange={(e) => setMetaAccessToken(e.target.value)}
              placeholder={
                hasMeta
                  ? "••• (já configurado, preencha para substituir)"
                  : "Cole o access token"
              }
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>
        <Button onClick={saveMeta} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Meta"}
        </Button>
      </div>
    </div>
  );
}
