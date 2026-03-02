import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AlertTriangle } from "lucide-react";

export async function DisconnectedConnectionsBanner() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { agencyId?: string } | undefined;
  if (!user?.agencyId) return null;

  const disconnected = await db.agencyConnection.findMany({
    where: { agencyId: user.agencyId, status: "DISCONNECTED" },
    select: { provider: true },
  });

  if (disconnected.length === 0) return null;

  const providers = disconnected.map((c) =>
    c.provider === "META" ? "Meta Business" : "Google Ads"
  );

  return (
    <Link
      href="/settings"
      className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 shadow-sm transition-all duration-300 ease-in-out hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-950/70"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200/80 dark:bg-amber-800/50">
        <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-300" />
      </div>
      <div>
        <p className="font-semibold">Reconecte suas integrações</p>
        <p className="text-sm opacity-90">
          {providers.join(" e ")} desconectada{disconnected.length > 1 ? "s" : ""}. O token expirou ou foi revogado. Clique para reconectar.
        </p>
      </div>
    </Link>
  );
}
