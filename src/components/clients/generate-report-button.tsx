"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { notify } from "@/lib/ui-feedback";

export function GenerateReportButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  async function handleGenerate() {
    setLoading(true);
    setStatus({ type: null, message: "Preparando a execução do pipeline..." });

    try {
      const now = new Date();
      const period = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const createRes = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, period: period.toISOString() }),
      });

      if (!createRes.ok) {
        throw new Error("Não foi possível criar o relatório.");
      }

      const report = await createRes.json();

      const genRes = await fetch(`/api/reports/${report.id}/generate`, {
        method: "POST",
      });

      if (!genRes.ok) {
        throw new Error("Não foi possível iniciar a geração.");
      }

      setStatus({
        type: "success",
        message: "Pipeline iniciado. Acompanhe o status na aba Relatórios.",
      });
      notify({
        variant: "success",
        title: "Geração iniciada",
        description: "Estamos coletando dados e montando o relatório.",
        actionLabel: "Abrir relatório",
        actionHref: `/reports/${report.id}`,
      });
    } catch (error) {
      setStatus({ 
        type: "error", 
        message: error instanceof Error ? error.message : "Ocorreu um erro desconhecido." 
      });
      notify({
        variant: "error",
        title: "Falha ao gerar relatório",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col md:items-end gap-3">
      <Button 
        onClick={handleGenerate} 
        disabled={loading}
        size="lg"
        className="font-medium rounded-xl shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4 fill-current text-amber-300" />
            Gerar relatório do mês anterior
          </>
        )}
      </Button>
      
      {status.type && (
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm shadow-sm transition-all duration-300 ease-in-out ${
          status.type === "success" 
            ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
            : "border-destructive/20 bg-destructive/10 text-destructive"
        }`}>
          {status.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {status.message}
        </div>
      )}
    </div>
  );
}
