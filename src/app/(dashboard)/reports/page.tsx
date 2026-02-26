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
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Relatórios</h2>
        <p className="text-sm text-muted-foreground">
          Histórico de relatórios gerados para todos os clientes.
        </p>
      </div>
      
      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center flex flex-col items-center justify-center bg-muted/10 max-w-3xl">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">Nenhum relatório gerado</h3>
          <p className="text-sm text-muted-foreground">
            Configure AGENCY_ID e execute o pipeline do dia 02 ou gere um relatório manualmente na página de um cliente.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
