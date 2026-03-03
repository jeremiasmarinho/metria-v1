import {
  generateClientReport,
  generateInternalReport,
} from "@/lib/integrations/openai";
import type { ProcessedMetrics } from "@/types/integrations";
import { OPENAI_TIMEOUT_MS, OPENAI_MAX_RETRIES } from "@/lib/constants";

const FALLBACK_ANALYSIS =
  "Os dados foram coletados. A análise automática não está disponível no momento. Revise os gráficos e métricas abaixo.";

export interface AnalysisResult {
  client: string;
  internal: string;
}

export async function analyzeMetrics(
  processed: ProcessedMetrics,
  clientName: string
): Promise<AnalysisResult> {
  const opts = { timeoutMs: OPENAI_TIMEOUT_MS };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= OPENAI_MAX_RETRIES; attempt++) {
    try {
      const [client, internal] = await Promise.all([
        generateClientReport(processed, clientName, opts),
        generateInternalReport(processed, clientName, opts),
      ]);
      if (client && internal) return { client, internal };
      lastError = new Error("Empty response from OpenAI");
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  return {
    client: FALLBACK_ANALYSIS,
    internal: FALLBACK_ANALYSIS,
  };
}
