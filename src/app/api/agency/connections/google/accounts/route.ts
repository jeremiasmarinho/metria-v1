import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { listGoogleAdsAccounts } from "@/lib/services/google-ads-accounts";
import { OAuthProvider } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; agencyId?: string } | undefined;
  if (!user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conn = await db.agencyConnection.findUnique({
    where: {
      agencyId_provider: {
        agencyId: user.agencyId,
        provider: OAuthProvider.GOOGLE,
      },
    },
  });

  if (!conn) {
    return NextResponse.json(
      {
        error: "Google Ads não conectada. Conecte a conta Google na página de Configurações.",
        code: "AGENCY_NOT_CONNECTED",
      },
      { status: 404 }
    );
  }

  if (conn.status === "DISCONNECTED") {
    return NextResponse.json(
      {
        error: "A conexão Google Ads expirou ou foi revogada. Reconecte na página de Configurações.",
        code: "TOKEN_EXPIRED",
      },
      { status: 403 }
    );
  }

  try {
    const accessToken = decrypt(conn.accessToken);
    const accounts = await listGoogleAdsAccounts(accessToken);
    const clientId = request.nextUrl.searchParams.get("clientId");
    if (clientId) {
      const clientsWithAccounts = await db.client.findMany({
        where: {
          agencyId: user.agencyId,
          googleAdsCustomerId: { not: null },
        },
        select: { id: true, name: true, googleAdsCustomerId: true },
      });
      const normalized = (v: string) => v.replace(/\D/g, "");
      const accountsWithLinked = accounts.map((a) => {
        const customerIdNorm = normalized(a.customerId);
        const linked = clientsWithAccounts.find(
          (c) => c.id !== clientId && c.googleAdsCustomerId && normalized(c.googleAdsCustomerId) === customerIdNorm
        );
        return {
          ...a,
          linkedToClient: linked ? { id: linked.id, name: linked.name } : undefined,
        };
      });
      return NextResponse.json({ accounts: accountsWithLinked });
    }
    return NextResponse.json({ accounts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao listar contas Google Ads";
    const code =
      msg.includes("401") || msg.includes("token") || msg.includes("expir")
        ? "TOKEN_EXPIRED"
        : undefined;
    return NextResponse.json({ error: msg, code }, { status: 400 });
  }
}
