import OpenAI from "openai";
import type { ProcessedMetrics } from "@/types/integrations";

const OPENAI_SYSTEM_PROMPT = `Você é um analista direto de marketing digital.
Analise os dados de performance e gere um resumo executivo em português brasileiro.

Regras:
- Seja direto e objetivo. Máximo 2-3 linhas.
- Se todos os dados forem zero: diga "Sem investimento no período" ou "Sem dados no período".
- Se houver dados: cite ROAS (se aplicável) e Custo por Conversão em 2 linhas.
- Use apenas os dados fornecidos. Não invente nada.`;

async function callOpenAI(
  systemPrompt: string,
  userContent: string,
  options?: { timeoutMs?: number; maxTokens?: number }
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const client = new OpenAI({ apiKey });
  const timeoutMs = options?.timeoutMs ?? 90_000;
  const maxTokens = options?.maxTokens ?? 1500;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const completion = await client.chat.completions.create(
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: maxTokens,
      },
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    return completion.choices[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/** Relatório executivo curto (legado). */
export async function generateExecutiveSummary(
  metricsJson: string,
  options?: { timeoutMs?: number }
): Promise<string> {
  return callOpenAI(
    OPENAI_SYSTEM_PROMPT,
    `Analise estes dados de marketing. Seja direto. Se dados zero: "Sem investimento no período". Se houver dados: cite ROAS e Custo por Conversão em 2 linhas.\n\n${metricsJson}`,
    { ...options, maxTokens: 800 }
  );
}

const CLIENT_REPORT_SYSTEM = `Você é um analista de marketing digital sênior.
Seu relatório será enviado ao CLIENTE. Deve ser simples, executivo e orientado a dinheiro.

Regras:
- Linguagem estratégica, direta e executiva.
- Use APENAS os dados fornecidos. Não invente métricas.
- Se dados forem zero ou inexistentes: diga de forma profissional.
- Foque em: eficiência das campanhas, custo por lead/conversão, discrepância Meta vs GA4 (quando houver ambos).
- Estruture em parágrafos curtos.`;

const CLIENT_REPORT_USER = (params: {
  clientName: string;
  period: string;
  json: string;
}) => `Cliente: ${params.clientName}
Período analisado: ${params.period}

Analise os dados e gere um RELATÓRIO EXECUTIVO para o cliente. Inclua:

1. Resumo geral (sessões, usuários, conversões quando disponíveis)
2. Eficiência real das campanhas pagas (investimento x conversões)
3. Se houver Meta e GA4: discrepância relevante entre os números reportados
4. Custo por lead/conversão quando o investimento e conversões estiverem disponíveis
5. Recomendações práticas para o próximo mês (máximo 2–3 ações)

Seja estratégico, direto e executivo. O cliente quer saber se o investimento está trazendo resultado.

Dados:
${params.json}`;

/** Relatório para o cliente (vai no PDF). */
export async function generateClientReport(
  processed: ProcessedMetrics,
  clientName: string,
  options?: { timeoutMs?: number }
): Promise<string> {
  const periodFormatted = formatPeriod(processed.period);
  const json = JSON.stringify(processed, null, 2);
  return callOpenAI(
    CLIENT_REPORT_SYSTEM,
    CLIENT_REPORT_USER({ clientName, period: periodFormatted, json }),
    { ...options, maxTokens: 1200 }
  );
}

const INTERNAL_REPORT_SYSTEM = `Você é um analista de marketing digital experiente.
Este relatório é para a EQUIPE da agência. Deve ser operacional e orientado a ação.

Regras:
- Use APENAS os dados fornecidos. Não invente métricas.
- Foque em: gargalos, oportunidades e AÇÕES RECOMENDADAS.
- O evento de conversão (conversões GA4) representa leads reais quando disponível.
- OBRIGATÓRIO: termine sempre com 2 AÇÕES RECOMENDADAS numeradas e específicas.`;

const INTERNAL_REPORT_USER = (params: {
  clientName: string;
  period: string;
  json: string;
}) => `Contexto: Relatório interno da agência para o cliente ${params.clientName}.
Período: ${params.period}

Analise os dados e gere um RELATÓRIO INTERNO para a equipe. Inclua:

1. Resumo executivo do desempenho geral
2. Pontos fortes e fracos identificados (baseado nos dados)
3. Gargalos claros (ex: alto investimento com poucas conversões, tráfego sem conversão)
4. Oportunidades práticas de melhoria
5. Duas ações recomendadas para o próximo mês (OBRIGATÓRIO, numeradas e específicas)

Seja direto, estratégico e orientado à tomada de decisão.

Dados:
${params.json}`;

/** Relatório interno para a equipe (não vai no PDF). */
export async function generateInternalReport(
  processed: ProcessedMetrics,
  clientName: string,
  options?: { timeoutMs?: number }
): Promise<string> {
  const periodFormatted = formatPeriod(processed.period);
  const json = JSON.stringify(processed, null, 2);
  return callOpenAI(
    INTERNAL_REPORT_SYSTEM,
    INTERNAL_REPORT_USER({ clientName, period: periodFormatted, json }),
    { ...options, maxTokens: 1500 }
  );
}

function formatPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
}
