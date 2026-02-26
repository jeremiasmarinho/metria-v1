import { db } from "@/lib/db";
import Link from "next/link";
import { Users, FileText } from "lucide-react";

export default async function DashboardPage() {
  const agencyId = process.env.AGENCY_ID;
  let clientsCount = 0;
  let reportsCount = 0;
  if (agencyId) {
    try {
      [clientsCount, reportsCount] = await Promise.all([
        db.client.count({ where: { agencyId } }),
        db.report.count({ where: { agencyId } }),
      ]);
    } catch {
      // DB not configured or not migrated
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/clients"
          className="rounded-lg border p-6 hover:bg-muted/50 transition-colors"
        >
          <Users className="h-8 w-8 text-muted-foreground" />
          <h3 className="mt-2 font-medium">Clientes</h3>
          <p className="text-2xl font-bold">{clientsCount}</p>
        </Link>
        <Link
          href="/reports"
          className="rounded-lg border p-6 hover:bg-muted/50 transition-colors"
        >
          <FileText className="h-8 w-8 text-muted-foreground" />
          <h3 className="mt-2 font-medium">Relatórios</h3>
          <p className="text-2xl font-bold">{reportsCount}</p>
        </Link>
      </div>
      {!agencyId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Configure AGENCY_ID no .env e execute o seed para ver os dados.
        </div>
      )}
    </div>
  );
}
