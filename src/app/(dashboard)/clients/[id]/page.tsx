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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border rounded-xl p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
              <Badge variant={client.active ? "default" : "secondary"} className={client.active ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
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
                <span>Desde {client.createdAt.toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>
          <GenerateReportButton clientId={client.id} />
        </div>

        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Informações
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="reports" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Últimos Relatórios</h3>
            </div>
            
            {client.reports.length === 0 ? (
              <div className="rounded-xl border border-dashed p-12 text-center flex flex-col items-center justify-center bg-muted/10">
                <FileText className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                <h4 className="text-lg font-medium mb-1">Nenhum relatório gerado</h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Utilize o botão "Gerar Relatório" acima para criar o primeiro relatório deste cliente.
                </p>
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
            <Card>
              <CardHeader>
                <CardTitle>Dados do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 text-sm">
                  <div>
                    <dt className="text-muted-foreground font-medium mb-1">Nome da Empresa</dt>
                    <dd className="bg-muted/50 p-2.5 rounded-md border">{client.name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium mb-1">Slug (Identificador)</dt>
                    <dd className="bg-muted/50 p-2.5 rounded-md border font-mono">{client.slug}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium mb-1">E-mail de Contato</dt>
                    <dd className="bg-muted/50 p-2.5 rounded-md border">{client.email ?? "Não informado"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium mb-1">Telefone / WhatsApp</dt>
                    <dd className="bg-muted/50 p-2.5 rounded-md border">{client.phone ?? "Não informado"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium mb-1">Data de Cadastro</dt>
                    <dd className="bg-muted/50 p-2.5 rounded-md border">{client.createdAt.toLocaleString("pt-BR")}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium mb-1">Última Atualização</dt>
                    <dd className="bg-muted/50 p-2.5 rounded-md border">{client.updatedAt.toLocaleString("pt-BR")}</dd>
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
