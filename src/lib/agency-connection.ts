import { db } from "@/lib/db";
import { OAuthProvider } from "@prisma/client";

/**
 * Marca uma conexão de agência como desconectada quando o token OAuth
 * expirou ou foi revogado (ex: usuário mudou senha, revogou acesso).
 * Permite que o ingest continue com outras fontes (graceful degradation)
 * e que o Dashboard mostre alerta para reconectar.
 */
export async function markAgencyConnectionDisconnected(
  agencyId: string,
  provider: OAuthProvider
): Promise<void> {
  await db.agencyConnection.updateMany({
    where: { agencyId, provider },
    data: { status: "DISCONNECTED" },
  });
}
