import { db } from "@/lib/db";
import { ClientCard } from "@/components/clients/client-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Client, Report } from "@prisma/client";

type ClientWithReports = Client & { reports: Report[] };

export default async function ClientsPage() {
  const agencyId = process.env.AGENCY_ID;
  let clients: ClientWithReports[] = [];
  
  if (agencyId) {
    try {
      clients = await db.client.findMany({ 
        where: { agencyId },
        include: {
          reports: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        },
        orderBy: { name: "asc" } 
      });
    } catch {
      // DB not configured
    }
  }

  return (
    <div className="space-y-6">
      <section className="app-section app-enter">
        <div className="app-section-header">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Clientes</h2>
          <p className="text-sm text-muted-foreground">
            Gestão de contas, integrações e histórico de entregas — tudo em um só lugar.
          </p>
        </div>
        <Link href="/clients/new">
          <Button className="rounded-xl shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Novo cliente
          </Button>
        </Link>
        </div>
      </section>
      <div className="app-enter app-enter-delay-1 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => {
          const integrations = client.integrations as Record<string, unknown> | null;
          const hasGoogle = !!integrations?.google;
          const hasMeta = !!integrations?.meta;
          const lastReport = client.reports[0];

          return (
            <ClientCard
              key={client.id}
              id={client.id}
              name={client.name}
              slug={client.slug}
              active={client.active}
              email={client.email}
              hasGoogle={hasGoogle}
              hasMeta={hasMeta}
              lastReportDate={lastReport?.createdAt}
            />
          );
        })}
      </div>
      {clients.length === 0 && (
        <div className="app-surface-subtle app-enter app-enter-delay-2 flex flex-col items-center border-dashed p-12 text-center text-muted-foreground">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted shadow-sm">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">Nenhum cliente cadastrado</p>
          <p className="text-sm mt-1 mb-4">
            Comece adicionando seu primeiro cliente para centralizar dados e automatizar relatórios.
          </p>
          <div className="mb-5 w-full max-w-xs space-y-2">
            <div className="app-skeleton h-3 w-full" />
            <div className="app-skeleton h-3 w-5/6" />
          </div>
          <Link href="/clients/new">
            <Button
              variant="outline"
              className="rounded-xl transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-sm"
            >
              Adicionar cliente
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
