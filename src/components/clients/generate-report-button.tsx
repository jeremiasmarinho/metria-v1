"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, CheckCircle2, AlertCircle } from "lucide-react";

export function GenerateReportButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  async function handleGenerate() {
    setLoading(true);
    setStatus({ type: null, message: "Criando relatório..." });

    try {
      const now = new Date();
      const period = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const createRes = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, period: period.toISOString() }),
      });

      if (!createRes.ok) {
        throw new Error("Erro ao criar relatório");
      }

      const report = await createRes.json();

      const genRes = await fetch(`/api/reports/${report.id}/generate`, {
        method: "POST",
      });

      if (!genRes.ok) {
        throw new Error("Erro ao disparar geração");
      }

      setStatus({ 
        type: "success", 
        message: "Pipeline disparado! Acompanhe na aba Relatórios." 
      });
    } catch (error) {
      setStatus({ 
        type: "error", 
        message: error instanceof Error ? error.message : "Ocorreu um erro desconhecido." 
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
        className="font-medium shadow-sm"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4 fill-current text-amber-300" />
            Gerar Relatório (mês anterior)
          </>
        )}
      </Button>
      
      {status.type && (
        <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md ${
          status.type === "success" 
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
            : "bg-destructive/10 text-destructive border border-destructive/20"
        }`}>
          {status.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {status.message}
        </div>
      )}
    </div>
  );
}
