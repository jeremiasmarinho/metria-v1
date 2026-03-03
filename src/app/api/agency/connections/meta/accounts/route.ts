import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { listMetaAdAccounts } from "@/lib/services/meta-ad-accounts";
import { OAuthProvider } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
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
        { error: "Meta não conectada. Conecte a conta Meta na página de Configurações." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "A conexão Meta expirou ou foi revogada. Reconecte na página de Configurações." },
      { status: 403 }
    );
  }

  try {
    const accounts = await listMetaAdAccounts(accessToken);
    return NextResponse.json({ accounts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao listar contas Meta";
    return NextResponse.json(
      { error: msg },
      { status: 400 }
    );
  }
}
