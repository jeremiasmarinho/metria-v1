import { generateOtoDualReport } from "@/lib/integrations/openai";
import type { ProcessedMetrics } from "@/types/integrations";
import type { AIAnalysisOutput } from "@/types/report";
import { OPENAI_TIMEOUT_MS, OPENAI_MAX_RETRIES } from "@/lib/constants";

const FALLBACK_RESUMO =
  "Os dados foram coletados. A análise automática não está disponível no momento. Revise os gráficos e métricas abaixo.";
const FALLBACK_DIAGNOSTICO = "Diagnóstico indisponível.";
const FALLBACK_CANAL = "—";
const FALLBACK_GARGALO = "—";
const FALLBACK_ACOES = [
  "Revise os dados de conversão e intenção no próximo período.",
  "Configure eventos de conversão em GA4 e Meta conforme o mapeamento de KPIs do cliente.",
];

export type { AIAnalysisOutput };

function fallbackOutput(clientName: string, period: string): AIAnalysisOutput {
  return {
    clientReport: { resumoExecutivo: FALLBACK_RESUMO },
    internalReport: {
      diagnosticoGeral: FALLBACK_DIAGNOSTICO,
      canalMaisEficiente: FALLBACK_CANAL,
      gargaloPrincipal: FALLBACK_GARGALO,
      acoesRecomendadas: FALLBACK_ACOES,
    },
  };
}

export async function analyzeMetrics(
  processed: ProcessedMetrics,
  clientName: string
): Promise<AIAnalysisOutput> {
  const opts = { timeoutMs: OPENAI_TIMEOUT_MS };

  for (let attempt = 0; attempt <= OPENAI_MAX_RETRIES; attempt++) {
    try {
      const output = await generateOtoDualReport(processed, clientName, opts);
      if (
        output?.clientReport?.resumoExecutivo &&
        output?.internalReport &&
        Array.isArray(output.internalReport.acoesRecomendadas)
      ) {
        return output;
      }
    } catch {
      // retry
    }
  }

  return fallbackOutput(clientName, processed.period);
}

/**
 * Converte o relatório interno estruturado em texto para armazenamento/UI.
 */
export function formatInternalReportForStorage(internal: AIAnalysisOutput["internalReport"]): string {
  const lines: string[] = [
    internal.diagnosticoGeral,
    "",
    `Canal mais eficiente: ${internal.canalMaisEficiente}`,
    `Gargalo principal: ${internal.gargaloPrincipal}`,
    "",
    "Ações recomendadas:",
    ...(internal.acoesRecomendadas?.map((a, i) => `${i + 1}. ${a}`) ?? []),
  ];
  return lines.join("\n");
}
