import { db } from "@/lib/db";
import Link from "next/link";
import { Users, FileText, CheckCircle2, CalendarClock, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportStatus } from "@/components/reports/report-status";
import type { Report } from "@prisma/client";

type ReportWithClient = Report & { client: { name: string } };

export default async function DashboardPage() {
  const agencyId = process.env.AGENCY_ID;
  
  let clientsCount = 0;
  let activeClientsCount = 0;
  let reportsCount = 0;
  let completedReportsCount = 0;
  let latestReports: ReportWithClient[] = [];
  
  if (agencyId) {
    try {
      const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      
      const [
        totalClients,
        activeClients,
        totalReportsThisMonth,
        completedReportsThisMonth,
        recent
      ] = await Promise.all([
        db.client.count({ where: { agencyId } }),
        db.client.count({ where: { agencyId, active: true } }),
        db.report.count({ where: { agencyId, period: { gte: currentMonthStart } } }),
        db.report.count({ where: { agencyId, status: "COMPLETED", period: { gte: currentMonthStart } } }),
        db.report.findMany({
          where: { agencyId },
          include: { client: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5
        })
      ]);
      
      clientsCount = totalClients;
      activeClientsCount = activeClients;
      reportsCount = totalReportsThisMonth;
      completedReportsCount = completedReportsThisMonth;
      latestReports = recent;
    } catch {
      // DB not configured or not migrated
    }
  }

  const successRate = reportsCount > 0 ? Math.round((completedReportsCount / reportsCount) * 100) : 0;
  
  const getNextExecutionDate = () => {
    const now = new Date();
    let nextMonth = now.getMonth() + 1;
    let nextYear = now.getFullYear();
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }
    return new Date(nextYear, nextMonth, 2).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <div className="space-y-8">
      {!agencyId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Configure AGENCY_ID no .env e execute o seed para ver os dados reais.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Visão Geral</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClientsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              de {clientsCount} clientes totais
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios este mês</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              gerados ou em processamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              relatórios concluídos sem erro
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Próxima Execução</CardTitle>
            <CalendarClock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-primary mt-1">{getNextExecutionDate()}</div>
            <p className="text-xs text-primary/80 mt-1">
              Pipeline automático agendado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimos Relatórios</CardTitle>
            <Link href="/reports" className="text-sm text-primary hover:underline flex items-center">
              Ver todos <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {latestReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">Nenhum relatório gerado ainda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {latestReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{report.client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.period.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <ReportStatus status={report.status} />
                      <Link 
                        href={`/reports/${report.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Detalhes
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/clients/new" className="flex items-center p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group">
              <div className="bg-primary/10 p-2 rounded-md mr-3 group-hover:bg-primary/20 transition-colors">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Adicionar Cliente</p>
                <p className="text-xs text-muted-foreground">Cadastre um novo cliente e suas integrações.</p>
              </div>
            </Link>
            
            <Link href="/settings" className="flex items-center p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group">
              <div className="bg-primary/10 p-2 rounded-md mr-3 group-hover:bg-primary/20 transition-colors">
                <CalendarClock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Configurar Agência</p>
                <p className="text-xs text-muted-foreground">Verifique chaves de API e integrações base.</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
