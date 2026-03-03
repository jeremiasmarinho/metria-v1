import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GenerateReportButton } from "@/components/clients/generate-report-button";
import { ClientDetailTabs } from "@/components/clients/client-detail-tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar } from "lucide-react";
import { OAuthProvider } from "@prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [client, session] = await Promise.all([
    db.client.findUnique({
      where: { id },
      include: { reports: { orderBy: { period: "desc" }, take: 10 } },
    }),
    getServerSession(authOptions),
  ]);

  if (!client) notFound();

  const agencyId = (session?.user as { agencyId?: string } | undefined)?.agencyId;
  const agencyConnections = agencyId
    ? await db.agencyConnection.findMany({
        where: { agencyId, status: "CONNECTED" },
        select: { provider: true },
      })
    : [];
  const agencyHasMeta = agencyConnections.some((c) => c.provider === OAuthProvider.META);
  const agencyHasGoogle = agencyConnections.some((c) => c.provider === OAuthProvider.GOOGLE);

  const integrations = client.integrations as Record<string, unknown> | null;
  const reportConfig = (client.reportConfig ?? {}) as {
    googlePropertyId?: string;
    googleSiteUrl?: string;
    metaAdAccountId?: string;
  };

  return (
    <div>
      <div className="space-y-8">
        <section className="app-section app-enter">
          <div className="app-section-body flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{client.name}</h1>
              <Badge variant={client.active ? "default" : "secondary"} className={`transition-all duration-300 ease-in-out ${client.active ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}>
                {client.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {client.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Ativo desde {client.createdAt.toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>
          <GenerateReportButton clientId={client.id} />
          </div>
        </section>

        <ClientDetailTabs
          client={client}
          reportConfig={reportConfig}
          integrations={integrations}
          agencyHasMeta={agencyHasMeta}
          agencyHasGoogle={agencyHasGoogle}
        />
      </div>
    </div>
  );
}
