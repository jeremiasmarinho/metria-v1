import { db } from "@/lib/db";
import { Shell } from "@/components/layout/shell";
import { ReportCard } from "@/components/reports/report-card";

export default async function ReportsPage() {
  const agencyId = process.env.AGENCY_ID;
  let reports: Awaited<
    ReturnType<
      typeof db.report.findMany<{
        include: { client: true };
      }>
    >
  > = [];
  if (agencyId) {
    try {
      reports = await db.report.findMany({
        where: { agencyId },
        include: { client: true },
        orderBy: { period: "desc" },
        take: 50,
      });
    } catch {
      // DB not configured
    }
  }

  return (
    <Shell title="Relatórios">
      <h2 className="text-xl font-semibold mb-6">Relatórios</h2>
      <div className="space-y-2">
        {reports.map((report) => (
          <ReportCard
            key={report.id}
            id={report.id}
            clientName={report.client.name}
            period={report.period.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            status={report.status}
          />
        ))}
      </div>
      {reports.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nenhum relatório gerado. Configure AGENCY_ID e execute o pipeline do dia 02.
        </div>
      )}
    </Shell>
  );
}
