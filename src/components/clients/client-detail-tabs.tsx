"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Settings, Info } from "lucide-react";
import { ReportCard } from "@/components/reports/report-card";
import { ClientIntegrations } from "./client-integrations";
import { ClientInfoEditor } from "./client-info-editor";
import type { Report, Client } from "@prisma/client";

type ClientWithReports = Client & { reports: Report[] };

interface ClientDetailTabsProps {
  client: ClientWithReports;
  reportConfig: {
    googlePropertyId?: string;
    googleSiteUrl?: string;
    metaAdAccountId?: string;
    trackingPreferences?: {
      ga4IntentEvents?: string[];
      ga4ConversionEvents?: string[];
      metaConversionEvents?: string[];
    };
  };
  integrations: Record<string, unknown> | null;
  agencyHasMeta?: boolean;
  agencyHasGoogle?: boolean;
}

export function ClientDetailTabs({
  client,
  reportConfig,
  integrations,
  agencyHasMeta = false,
  agencyHasGoogle = false,
}: ClientDetailTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const openLinkParam = searchParams.get("openLinkModal");

  const [activeTab, setActiveTab] = useState(() => {
    if (tabParam === "integrations" || tabParam === "info") return tabParam;
    return "reports";
  });

  const openLinkModalOnMount =
    openLinkParam === "meta"
      ? ("meta" as const)
      : openLinkParam === "google"
        ? ("google" as const)
        : undefined;

  useEffect(() => {
    if (tabParam === "integrations" || tabParam === "info") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="app-enter app-enter-delay-1 w-full"
    >
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
                period={report.createdAt.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
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
          metaAdAccountId={client.metaAdAccountId}
          googleAdsCustomerId={client.googleAdsCustomerId}
          hasGoogle={!!integrations?.google || (!!client.googleAdsCustomerId && agencyHasGoogle)}
          hasMeta={!!integrations?.meta || (!!client.metaAdAccountId && agencyHasMeta)}
          metaUsesAgency={!!client.metaAdAccountId && !integrations?.meta && agencyHasMeta}
          googleUsesAgency={!!client.googleAdsCustomerId && !integrations?.google && agencyHasGoogle}
          openLinkModalOnMount={openLinkModalOnMount}
        />
      </TabsContent>

      <TabsContent value="info">
        <ClientInfoEditor
          client={{
            id: client.id,
            name: client.name,
            slug: client.slug,
            email: client.email,
            phone: client.phone,
            active: client.active,
            createdAt: client.createdAt.toISOString(),
            updatedAt: client.updatedAt.toISOString(),
          }}
        />
      </TabsContent>
    </Tabs>
  );
}
