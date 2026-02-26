import OpenAI from "openai";

const OPENAI_SYSTEM_PROMPT = `Você é um analista sênior de marketing digital.
Receba os dados de performance do mês e gere um Relatório Executivo em português brasileiro.

Regras:
- Máximo 4 parágrafos.
- Comece com o destaque positivo mais relevante.
- Aponte 1-2 pontos de atenção com sugestão de ação.
- Use números exatos (não arredonde demais).
- Tom profissional mas acessível (o leitor é dono de empresa, não técnico).
- NÃO invente dados. Use apenas o que foi fornecido.`;

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
            content: `Analise os seguintes dados de marketing e gere o relatório executivo:\n\n${metricsJson}`,
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
