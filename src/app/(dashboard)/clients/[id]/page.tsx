import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ReportCard } from "@/components/reports/report-card";
import { ClientIntegrations } from "@/components/clients/client-integrations";
import { GenerateReportButton } from "@/components/clients/generate-report-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar, FileText, Settings, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

        <Tabs defaultValue="reports" className="app-enter app-enter-delay-1 w-full">
          <TabsList className="mb-8 grid w-full max-w-md grid-cols-3 rounded-xl">
            <TabsTrigger value="reports" className="flex items-center gap-2 transition-all duration-300 ease-in-out">
              <FileText className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2 transition-all duration-300 ease-in-out">
              <Settings className="h-4 w-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2 transition-all duration-300 ease-in-out">
              <Info className="h-4 w-4" />
              Informações
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="reports" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Últimos relatórios</h3>
            </div>
            
            {client.reports.length === 0 ? (
              <div className="app-surface-subtle flex flex-col items-center justify-center border-dashed p-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                <h4 className="text-lg font-medium mb-1">Nenhum relatório gerado</h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Gere o primeiro relatório para consolidar performance e validar as integrações.
                </p>
                <div className="mt-5 w-full max-w-xs space-y-2">
                  <div className="app-skeleton h-3 w-full" />
                  <div className="app-skeleton h-3 w-4/6" />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
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
            )}
          </TabsContent>
          
          <TabsContent value="integrations">
            <ClientIntegrations
              clientId={client.id}
              reportConfig={reportConfig}
              hasGoogle={!!integrations?.google}
              hasMeta={!!integrations?.meta}
            />
          </TabsContent>
          
          <TabsContent value="info">
            <Card className="rounded-2xl border-border/70 shadow-md transition-all duration-300 ease-in-out">
              <CardHeader>
                <CardTitle>Dados do Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="app-table-shell text-sm">
                  <div className="app-table-row flex-col items-start gap-1 sm:flex-row sm:items-center">
                    <dt className="font-semibold text-foreground">Nome da Empresa</dt>
                    <dd className="text-muted-foreground">{client.name}</dd>
                  </div>
                  <div className="app-table-row flex-col items-start gap-1 sm:flex-row sm:items-center">
                    <dt className="font-semibold text-foreground">Slug (Identificador)</dt>
                    <dd className="font-mono text-muted-foreground">{client.slug}</dd>
                  </div>
                  <div className="app-table-row flex-col items-start gap-1 sm:flex-row sm:items-center">
                    <dt className="font-semibold text-foreground">E-mail de Contato</dt>
                    <dd className="text-muted-foreground">{client.email ?? "Não informado"}</dd>
                  </div>
                  <div className="app-table-row flex-col items-start gap-1 sm:flex-row sm:items-center">
                    <dt className="font-semibold text-foreground">Telefone / WhatsApp</dt>
                    <dd className="text-muted-foreground">{client.phone ?? "Não informado"}</dd>
                  </div>
                  <div className="app-table-row flex-col items-start gap-1 sm:flex-row sm:items-center">
                    <dt className="font-semibold text-foreground">Data de Cadastro</dt>
                    <dd className="text-muted-foreground">{client.createdAt.toLocaleString("pt-BR")}</dd>
                  </div>
                  <div className="app-table-row flex-col items-start gap-1 sm:flex-row sm:items-center">
                    <dt className="font-semibold text-foreground">Última Atualização</dt>
                    <dd className="text-muted-foreground">{client.updatedAt.toLocaleString("pt-BR")}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
