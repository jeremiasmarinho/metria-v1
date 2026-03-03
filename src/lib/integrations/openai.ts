import OpenAI from "openai";

const OPENAI_SYSTEM_PROMPT = `Você é um analista direto de marketing digital.
Analise os dados de performance e gere um resumo executivo em português brasileiro.

Regras:
- Seja direto e objetivo. Máximo 2-3 linhas.
- Se todos os dados forem zero: diga "Sem investimento no período" ou "Sem dados no período".
- Se houver dados: cite ROAS (se aplicável) e Custo por Conversão em 2 linhas.
- Use apenas os dados fornecidos. Não invente nada.`;

export async function generateExecutiveSummary(
  metricsJson: string,
  options?: { timeoutMs?: number }
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const client = new OpenAI({ apiKey });
  const timeoutMs = options?.timeoutMs ?? 60_000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const completion = await client.chat.completions.create(
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: OPENAI_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analise estes dados de marketing. Seja direto. Se dados zero: "Sem investimento no período". Se houver dados: cite ROAS e Custo por Conversão em 2 linhas.\n\n${metricsJson}`,
          },
        ],
        max_tokens: 800,
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
