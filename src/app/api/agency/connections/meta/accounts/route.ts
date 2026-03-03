import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { listMetaAdAccounts } from "@/lib/services/meta-ad-accounts";
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
        provider: OAuthProvider.META,
      },
    },
  });

  let accessToken: string | undefined;

  if (conn && conn.status !== "DISCONNECTED") {
    accessToken = decrypt(conn.accessToken);
  } else if (
    process.env.NODE_ENV !== "production" &&
    process.env.META_ADS_ACCESS_TOKEN
  ) {
    accessToken = process.env.META_ADS_ACCESS_TOKEN;
  }

  if (!accessToken) {
    if (!conn) {
      return NextResponse.json(
        {
          error: "Meta não conectada. Conecte a conta Meta na página de Configurações.",
          code: "AGENCY_NOT_CONNECTED",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        error: "A conexão Meta expirou ou foi revogada. Reconecte na página de Configurações.",
        code: "TOKEN_EXPIRED",
      },
      { status: 403 }
    );
  }

  try {
    const accounts = await listMetaAdAccounts(accessToken);
    const clientId = request.nextUrl.searchParams.get("clientId");
    if (clientId) {
      const clientsWithAccounts = await db.client.findMany({
        where: {
          agencyId: user.agencyId,
          metaAdAccountId: { not: null },
        },
        select: { id: true, name: true, metaAdAccountId: true },
      });
      const accountsWithLinked = accounts.map((a) => {
        const linked = clientsWithAccounts.find(
          (c) => c.id !== clientId && c.metaAdAccountId && c.metaAdAccountId === a.id
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
    const msg = err instanceof Error ? err.message : "Erro ao listar contas Meta";
    const code =
      msg.includes("401") || msg.includes("META_TOKEN") || msg.includes("expir")
        ? "TOKEN_EXPIRED"
        : undefined;
    return NextResponse.json({ error: msg, code }, { status: 400 });
  }
}
