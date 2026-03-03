"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { notify } from "@/lib/ui-feedback";

type ReportStatus =
  | "PENDING"
  | "INGESTING"
  | "PROCESSING"
  | "ANALYZING"
  | "COMPILING"
  | "STORING"
  | "DELIVERING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED";

const STATUS_MESSAGES: Record<ReportStatus, string> = {
  PENDING: "Preparando...",
  INGESTING: "Capturando dados...",
  PROCESSING: "Processando métricas...",
  ANALYZING: "Gerando IA...",
  COMPILING: "Gerando PDF...",
  STORING: "Armazenando...",
  DELIVERING: "Enviando e-mail...",
  COMPLETED: "Relatório gerado e enviado por e-mail.",
  PARTIAL: "Relatório enviado. Algumas fontes de dados não responderam.",
  FAILED: "Ocorreu um erro na geração.",
};

function getFriendlyErrorMessage(raw: string | null): string {
  if (!raw) return "Ocorreu um erro. Tente novamente em instantes.";
  if (raw.includes("INGEST_NO_VALID_SOURCES") || raw.includes("PARTIAL_INGEST"))
    return "Não foi possível capturar dados das fontes configuradas (Google/Meta). Verifique as integrações.";
  if (raw.toLowerCase().includes("z-api") || raw.toLowerCase().includes("whatsapp"))
    return "O envio por WhatsApp falhou, mas o e-mail foi enviado.";
  if (raw.includes("RESEND") || raw.toLowerCase().includes("email"))
    return "Falha ao enviar e-mail. Verifique a configuração do Resend.";
  return raw.length > 80 ? `${raw.slice(0, 80)}...` : raw;
}

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 120;
const INNGEST_HINT_AFTER_POLLS = 15; // ~22s em PENDING = provável Inngest parado

async function pollReportStatus(
  reportId: string,
  onStatus: (status: ReportStatus, errorMessage?: string | null, hint?: string) => void
): Promise<{ status: ReportStatus; errorMessage?: string | null }> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const res = await fetch(`/api/reports/${reportId}`);
    if (!res.ok) throw new Error("Não foi possível obter o status do relatório.");

    const data = (await res.json()) as {
      status: ReportStatus;
      errorMessage?: string | null;
    };

    const hint =
      i >= INNGEST_HINT_AFTER_POLLS && data.status === "PENDING"
        ? " Verifique se o Inngest Dev Server está rodando (npx inngest-cli dev)."
        : undefined;
    onStatus(data.status, data.errorMessage ?? undefined, hint);

    if (data.status === "COMPLETED" || data.status === "PARTIAL" || data.status === "FAILED") {
      return { status: data.status, errorMessage: data.errorMessage };
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("A geração está demorando mais que o esperado. Consulte a aba Relatórios.");
}

export function GenerateReportButton({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const abortRef = useRef(false);

  async function handleGenerate() {
    setLoading(true);
    setStatus({ type: null, message: "" });
    setProgressMessage("Preparando...");
    abortRef.current = false;

    try {
      const now = new Date();
      const period = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const createRes = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, period: period.toISOString() }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Não foi possível criar o relatório.");
      }

      const report = (await createRes.json()) as { id: string };

      const genRes = await fetch(`/api/reports/${report.id}/generate`, {
        method: "POST",
      });

      if (!genRes.ok) {
        const err = await genRes.json().catch(() => ({}));
        throw new Error(err.error ?? "Não foi possível iniciar a geração.");
      }

      const { status: finalStatus, errorMessage } = await pollReportStatus(report.id, (s, _err, hint) => {
        if (!abortRef.current) {
          const base = STATUS_MESSAGES[s];
          setProgressMessage(hint ? `${base} ${hint}` : base);
        }
      });

      setProgressMessage(null);

      if (finalStatus === "COMPLETED") {
        setStatus({ type: "success", message: STATUS_MESSAGES.COMPLETED });
        notify({
          variant: "success",
          title: "Relatório enviado",
          description: "O relatório foi gerado e enviado por e-mail.",
          actionLabel: "Ver relatório",
          actionHref: `/reports/${report.id}`,
        });
      } else if (finalStatus === "PARTIAL") {
        setStatus({ type: "success", message: STATUS_MESSAGES.PARTIAL });
        notify({
          variant: "success",
          title: "Relatório enviado (parcial)",
          description: "Algumas fontes não responderam, mas o e-mail foi enviado.",
          actionLabel: "Ver relatório",
          actionHref: `/reports/${report.id}`,
        });
      } else {
        const msg = getFriendlyErrorMessage(errorMessage ?? null);
        setStatus({ type: "error", message: msg });
        notify({
          variant: "error",
          title: "Falha ao gerar relatório",
          description: msg,
        });
      }
    } catch (error) {
      setProgressMessage(null);
      const msg = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
      setStatus({ type: "error", message: msg });
      notify({
        variant: "error",
        title: "Falha ao gerar relatório",
        description: msg,
      });
    } finally {
      setLoading(false);
      abortRef.current = true;
    }
  }

  const displayMessage = progressMessage ?? status.message;

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
            {displayMessage || "Gerando..."}
          </>
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4 fill-current text-amber-300" />
            Gerar relatório do mês anterior
          </>
        )}
      </Button>

      {status.type && !loading && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm shadow-sm transition-all duration-300 ease-in-out ${
            status.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-destructive/20 bg-destructive/10 text-destructive"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}
