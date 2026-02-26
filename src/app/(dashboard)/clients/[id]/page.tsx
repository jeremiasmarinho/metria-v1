import { db } from "@/lib/db";
import { Shell } from "@/components/layout/shell";
import { notFound } from "next/navigation";
import { ReportCard } from "@/components/reports/report-card";
import { ClientIntegrations } from "@/components/clients/client-integrations";
import { GenerateReportButton } from "@/components/clients/generate-report-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const client = await db.client.findUnique({
    where: { id },
    include: { reports: { orderBy: { period: "desc" }, take: 10 } },
  });

  if (!client) notFound();

  const integrations = client.integrations as Record<string, unknown> | null;
  const reportConfig = (client.reportConfig ?? {}) as {
    googlePropertyId?: string;
    googleSiteUrl?: string;
    metaAdAccountId?: string;
  };

  return (
    <Shell title={client.name}>
      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Informações</h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div>
              <dt className="text-muted-foreground">E-mail</dt>
              <dd>{client.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Telefone</dt>
              <dd>{client.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>{client.active ? "Ativo" : "Inativo"}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h3 className="font-medium mb-4">Gerar relatório</h3>
          <GenerateReportButton clientId={client.id} />
        </div>
        <div>
          <h3 className="font-medium mb-4">Últimos relatórios</h3>
          <div className="space-y-2">
            {client.reports.map((report) => (
              <ReportCard
                key={report.id}
                id={report.id}
                clientName={client.name}
                period={report.period.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                status={report.status}
              />
            ))}
          </div>
          {client.reports.length === 0 && (
            <p className="text-muted-foreground text-sm">Nenhum relatório ainda.</p>
          )}
        </div>
        <div>
          <h3 className="font-medium mb-4">Integrações</h3>
          <ClientIntegrations
            clientId={client.id}
            reportConfig={reportConfig}
            hasGoogle={!!integrations?.google}
            hasMeta={!!integrations?.meta}
          />
        </div>
      </div>
    </Shell>
  );
}
