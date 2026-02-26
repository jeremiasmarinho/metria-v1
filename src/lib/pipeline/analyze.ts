import { generateExecutiveSummary } from "@/lib/integrations/openai";
import type { ProcessedMetrics } from "@/types/integrations";
import { OPENAI_TIMEOUT_MS, OPENAI_MAX_RETRIES } from "@/lib/constants";

const FALLBACK_ANALYSIS =
  "Os dados foram coletados. A análise automática não está disponível no momento. Revise os gráficos e métricas abaixo.";

export async function analyzeMetrics(processed: ProcessedMetrics): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= OPENAI_MAX_RETRIES; attempt++) {
    try {
      const json = JSON.stringify(processed, null, 2);
      const analysis = await generateExecutiveSummary(json, {
        timeoutMs: OPENAI_TIMEOUT_MS,
      });
      if (analysis) return analysis;
      lastError = new Error("Empty response from OpenAI");
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  return FALLBACK_ANALYSIS;
}
