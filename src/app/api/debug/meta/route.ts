import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Endpoint de debug: testa a conexão com a API Meta Ads.
 * Usa META_ADS_ACCESS_TOKEN do .env ou token da AgencyConnection.
 * GET /api/debug/meta
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const token =
    process.env.META_ADS_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({
      status: "Erro",
      message: "META_ADS_ACCESS_TOKEN não configurado no .env",
      contasEncontradas: 0,
    });
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v25.0/me/adaccounts?fields=id,name&access_token=${token}&limit=5`
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({
        status: "Erro",
        message: `API Meta retornou ${res.status}: ${text.slice(0, 200)}`,
        contasEncontradas: 0,
      });
    }

    const data = (await res.json()) as { data?: unknown[] };
    const contas = data.data ?? [];

    return NextResponse.json({
      status: "Sucesso",
      message: "Conexão com a API Meta estabelecida.",
      contasEncontradas: contas.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({
      status: "Erro",
      message: msg,
      contasEncontradas: 0,
    });
  }
}
