import { db } from "@/lib/db";
import { ReportCard } from "@/components/reports/report-card";
import { FileText } from "lucide-react";
import type { Report, Client } from "@prisma/client";

type ReportWithClient = Report & { client: Client };

export default async function ReportsPage() {
  const agencyId = process.env.AGENCY_ID;
  let reports: ReportWithClient[] = [];
  
  if (agencyId) {
    try {
      reports = await db.report.findMany({
        where: { agencyId },
        include: { client: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    } catch {
      // DB not configured
    }
  }

  return (
    <div className="space-y-6">
      <section className="app-section app-enter">
        <div className="app-section-body">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Relatórios</h2>
        <p className="text-sm text-muted-foreground">
          Histórico de performance por cliente — geração, status e entrega em um só fluxo.
        </p>
        </div>
      </section>
      
      {reports.length === 0 ? (
        <div className="app-surface-subtle app-enter app-enter-delay-1 flex max-w-3xl flex-col items-center justify-center border-dashed p-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted shadow-sm">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">Nenhum relatório gerado</h3>
          <p className="text-sm text-muted-foreground">
            Gere um relatório a partir da página do cliente e acompanhe cada etapa do pipeline em tempo real.
          </p>
          <div className="mt-5 w-full max-w-xs space-y-2">
            <div className="app-skeleton h-3 w-full" />
            <div className="app-skeleton h-3 w-4/6" />
          </div>
        </div>
      ) : (
        <div className="app-enter app-enter-delay-1 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              id={report.id}
              clientName={report.client.name}
              period={report.period.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}
              status={report.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
