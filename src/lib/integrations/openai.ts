import OpenAI from "openai";
import type { ProcessedMetrics } from "@/types/integrations";
import type { AIAnalysisOutput } from "@/types/report";

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

// --- Modelo Oto: relatório duplo em uma única chamada JSON ---

const OTO_SYSTEM = `Atue como um Analista Sênior de Marketing Digital.
Retorne um JSON estrito com exatamente duas chaves: "clientReport" e "internalReport".
Use apenas os dados fornecidos. Não invente métricas.`;

function buildOtoUserPrompt(params: {
  clientName: string;
  period: string;
  totalSessoes: number;
  totalUsuarios: number;
  totalIntentEvents: number;
  totalRealConversions: number;
  totalMetaConversions: number;
  investimentoTotal: number;
  cplMeta: number | null;
  cplReal: number | null;
  pageBreakdown: Array<{ page: string; source: string; sessions: number; intents: number; conversions: number }>;
  customPrompt?: string;
  googleAdsFocus?: string[];
  metaAdsFocus?: string[];
}): string {
  const {
    clientName,
    period,
    totalSessoes,
    totalUsuarios,
    totalIntentEvents,
    totalRealConversions,
    totalMetaConversions,
    investimentoTotal,
    cplMeta,
    cplReal,
    pageBreakdown,
    customPrompt,
    googleAdsFocus,
    metaAdsFocus,
  } = params;
  const breakdownJson =
    pageBreakdown.length > 0
      ? JSON.stringify(pageBreakdown.slice(0, 30), null, 2)
      : "[] (nenhum dado por página/origem)";
  const extraLines: string[] = [];
  if (customPrompt && customPrompt.trim().length > 0) {
    extraLines.push(
      "",
      "Instruções adicionais do analista (priorize estas orientações):",
      customPrompt.trim()
    );
  }
  if (googleAdsFocus && googleAdsFocus.length > 0) {
    extraLines.push(
      "",
      `Métricas mais importantes no Google Ads: ${googleAdsFocus.join(", ")}.`
    );
  }
  if (metaAdsFocus && metaAdsFocus.length > 0) {
    extraLines.push(
      "",
      `Métricas mais importantes no Meta Ads: ${metaAdsFocus.join(", ")}.`
    );
  }

  const extras = extraLines.length ? `${extraLines.join("\n")}\n` : "";

  return `Cliente: ${clientName}
Período: ${period}

Métricas calculadas:
- totalSessoes: ${totalSessoes}
- totalUsuarios: ${totalUsuarios}
- totalIntentEvents (intenção, ex.: cliques WhatsApp): ${totalIntentEvents}
- totalRealConversions (conversões reais GA4): ${totalRealConversions}
- totalMetaConversions (conversões Meta filtradas): ${totalMetaConversions}
- investimentoTotal (R$): ${investimentoTotal.toFixed(2)}
- cplMeta (investimentoTotal / totalMetaConversions): ${cplMeta != null ? `R$ ${cplMeta.toFixed(2)}` : "N/A"}
- cplReal (investimentoTotal / totalRealConversions): ${cplReal != null ? `R$ ${cplReal.toFixed(2)}` : "N/A"}

pageBreakdown (página, origem, sessões, intenções, conversões) — use para identificar gargalos:
${breakdownJson}

${extras}

Instruções:
Retorne um JSON com duas chaves:

1) "clientReport": objeto com uma chave "resumoExecutivo" (string).
   No resumoExecutivo: explique a eficiência real das campanhas, a discrepância entre leads reportados pelo Meta e leads reais do GA4 (quando aplicável), causas possíveis, impacto na decisão e recomendações executivas. Foco em Custo por Lead Real.

2) "internalReport": objeto com as chaves "diagnosticoGeral" (string), "canalMaisEficiente" (string), "gargaloPrincipal" (string), "acoesRecomendadas" (array de exatamente 2 strings).
   - diagnosticoGeral: resumo do desempenho para a equipe.
   - canalMaisEficiente: qual canal/origem performou melhor.
   - gargaloPrincipal: página ou contexto com alto tráfego e baixa conversão real (use pageBreakdown).
   - acoesRecomendadas: exatamente 2 ações práticas recomendadas.`;
}

/**
 * Gera os dois relatórios (cliente + interno) numa única chamada, com saída JSON estruturada (Modelo Oto).
 */
export async function generateOtoDualReport(
  processed: ProcessedMetrics,
  clientName: string,
  options?: {
    timeoutMs?: number;
    customPrompt?: string;
    googleAdsFocus?: string[];
    metaAdsFocus?: string[];
  }
): Promise<AIAnalysisOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const periodFormatted = formatPeriod(processed.period);
  const totalSessoes = processed.totalSessoes ?? processed.googleAnalytics?.sessions ?? 0;
  const totalUsuarios = processed.totalUsuarios ?? processed.googleAnalytics?.users ?? 0;
  const totalIntentEvents = processed.totalIntentEvents ?? 0;
  const totalRealConversions = processed.totalRealConversions ?? processed.googleAnalytics?.conversions ?? 0;
  const totalMetaConversions = processed.totalMetaConversions ?? processed.metaAds?.conversions ?? 0;
  const investimentoTotal = processed.investimentoTotal ?? processed.metaAds?.spend ?? 0;
  const cplMeta =
    totalMetaConversions > 0 && investimentoTotal >= 0
      ? investimentoTotal / totalMetaConversions
      : null;
  const cplReal =
    totalRealConversions > 0 && investimentoTotal >= 0
      ? investimentoTotal / totalRealConversions
      : null;
  const pageBreakdown = processed.pageBreakdown ?? [];

  const userContent = buildOtoUserPrompt({
    clientName,
    period: periodFormatted,
    totalSessoes,
    totalUsuarios,
    totalIntentEvents,
    totalRealConversions,
    totalMetaConversions,
    investimentoTotal,
    cplMeta,
    cplReal,
    pageBreakdown,
    customPrompt: options?.customPrompt,
    googleAdsFocus: options?.googleAdsFocus,
    metaAdsFocus: options?.metaAdsFocus,
  });

  const client = new OpenAI({ apiKey });
  const timeoutMs = options?.timeoutMs ?? 90_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const completion = await client.chat.completions.create(
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: OTO_SYSTEM },
          { role: "user", content: userContent },
        ],
        max_tokens: 2000,
        response_format: { type: "json_object" },
      },
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "clientReport" in parsed &&
      "internalReport" in parsed &&
      typeof (parsed as AIAnalysisOutput).clientReport?.resumoExecutivo === "string"
    ) {
      const out = parsed as AIAnalysisOutput;
      let acoes = out.internalReport.acoesRecomendadas;
      if (!Array.isArray(acoes)) acoes = [];
      if (acoes.length > 2) acoes = acoes.slice(0, 2);
      if (acoes.length < 2) {
        acoes = [
          ...acoes,
          ...Array(2 - acoes.length)
            .fill("Ação a definir com base nos dados.") as string[],
        ];
      }
      out.internalReport.acoesRecomendadas = acoes;
      return out;
    }
    throw new Error("Resposta da IA não contém clientReport.resumoExecutivo");
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}
