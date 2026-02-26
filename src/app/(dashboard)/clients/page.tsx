import { db } from "@/lib/db";
import { Shell } from "@/components/layout/shell";
import { ClientCard } from "@/components/clients/client-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function ClientsPage() {
  const agencyId = process.env.AGENCY_ID;
  let clients: Awaited<ReturnType<typeof db.client.findMany>> = [];
  if (agencyId) {
    try {
      clients = await db.client.findMany({ where: { agencyId }, orderBy: { name: "asc" } });
    } catch {
      // DB not configured
    }
  }

  return (
    <Shell title="Clientes">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Clientes</h2>
        <Link href="/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo cliente
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            id={client.id}
            name={client.name}
            slug={client.slug}
            active={client.active}
            email={client.email}
          />
        ))}
      </div>
      {clients.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nenhum cliente cadastrado. Configure AGENCY_ID no .env e execute o seed.
        </div>
      )}
    </Shell>
  );
}
