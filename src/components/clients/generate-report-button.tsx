"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GenerateReportButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setMessage("Criando relatório...");

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

    const genRes = await fetch(`/api/reports/${report.id}/generate`, {
      method: "POST",
    });

    setLoading(false);
    setMessage(
      genRes.ok
        ? "Pipeline disparado! Acompanhe em Relatórios."
        : "Erro ao disparar geração"
    );
  }

  return (
    <div>
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? "Gerando..." : "Gerar Relatório (mês anterior)"}
      </Button>
      {message && (
        <p className="text-sm mt-2 text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
