import { db } from "@/lib/db";
import Link from "next/link";
import { Users, FileText, CheckCircle2, CalendarClock, ArrowUpRight, Sparkles } from "lucide-react";
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

      const [totalClients, activeClients, totalReportsThisMonth, completedReportsThisMonth, recent] =
        await Promise.all([
          db.client.count({ where: { agencyId } }),
          db.client.count({ where: { agencyId, active: true } }),
          db.report.count({ where: { agencyId, period: { gte: currentMonthStart } } }),
          db.report.count({
            where: { agencyId, status: "COMPLETED", period: { gte: currentMonthStart } },
          }),
          db.report.findMany({
            where: { agencyId },
            include: { client: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),
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
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {!agencyId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 shadow-sm transition-all duration-300 ease-in-out">
          Configure o `AGENCY_ID` no `.env` e execute o seed para visualizar dados reais no painel.
        </div>
      )}

      <div className="app-enter rounded-2xl border border-primary/20 bg-[linear-gradient(130deg,hsl(var(--primary)/0.22),hsl(var(--card))_35%)] p-7 shadow-xl backdrop-blur-sm">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Performance Hub
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Visão geral</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Acompanhe crescimento, eficiência operacional e consistência de entrega — em um só lugar.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="app-enter app-enter-delay-1 rounded-2xl border-border/70 bg-card shadow-md transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClientsCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">de {clientsCount} clientes no portfólio</p>
          </CardContent>
        </Card>

        <Card className="app-enter app-enter-delay-1 rounded-2xl border-border/70 bg-card shadow-md transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios neste mês</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">gerados ou em processamento</p>
          </CardContent>
        </Card>

        <Card className="app-enter app-enter-delay-2 rounded-2xl border-border/70 bg-card shadow-md transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="mt-1 text-xs text-muted-foreground">relatórios concluídos sem incidentes</p>
          </CardContent>
        </Card>

        <Card className="app-enter app-enter-delay-2 rounded-2xl border border-primary/25 bg-[linear-gradient(140deg,hsl(var(--primary)/0.2),hsl(var(--primary)/0.05))] shadow-md transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Próxima execução</CardTitle>
            <CalendarClock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="mt-1 text-lg font-bold text-primary">{getNextExecutionDate()}</div>
            <p className="mt-1 text-xs text-primary/80">Automação mensal agendada</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="app-enter app-enter-delay-3 col-span-4 rounded-2xl border-border/70 bg-card shadow-md transition-all duration-300 ease-out">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimos relatórios</CardTitle>
            <Link
              href="/reports"
              className="flex items-center rounded-lg px-2 py-1 text-sm text-primary transition-all duration-300 ease-out hover:bg-primary/10 hover:no-underline"
            >
              Ver todos <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {latestReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="mb-3 h-8 w-8 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Ainda não há relatórios — gere o primeiro para começar a acompanhar performance e entregas.
                </p>
                <div className="mt-5 w-full max-w-xs space-y-2">
                  <div className="app-skeleton h-3 w-full" />
                  <div className="app-skeleton h-3 w-5/6" />
                  <div className="app-skeleton h-3 w-4/6" />
                </div>
              </div>
            ) : (
              <div className="app-table-shell">
                {latestReports.map((report) => (
                  <div
                    key={report.id}
                    className="app-table-row"
                  >
                    <div>
                      <p className="app-table-row-title">{report.client.name}</p>
                      <p className="app-table-row-subtitle">
                        {report.period.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <ReportStatus status={report.status} />
                      <Link
                        href={`/reports/${report.id}`}
                        className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition-all duration-300 ease-out hover:bg-primary/10 hover:text-primary"
                      >
                        Abrir
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="app-enter app-enter-delay-3 col-span-3 rounded-2xl border-border/70 bg-card shadow-md transition-all duration-300 ease-out">
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/clients/new"
              className="group flex items-center rounded-xl border border-border/70 p-3 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/5 hover:shadow-sm"
            >
              <div className="mr-3 rounded-lg bg-primary/10 p-2 transition-all duration-300 ease-in-out group-hover:bg-primary/20">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Novo cliente</p>
                <p className="text-xs text-muted-foreground">
                  Cadastre uma nova conta e conecte suas integrações.
                </p>
              </div>
            </Link>

            <Link
              href="/settings"
              className="group flex items-center rounded-xl border border-border/70 p-3 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/5 hover:shadow-sm"
            >
              <div className="mr-3 rounded-lg bg-primary/10 p-2 transition-all duration-300 ease-in-out group-hover:bg-primary/20">
                <CalendarClock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Configurar Agência</p>
                <p className="text-xs text-muted-foreground">
                  Verifique chaves, integrações e requisitos do ambiente.
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

