import { Shell } from "@/components/layout/shell";

export default function SettingsPage() {
  return (
    <Shell title="Configurações">
      <div className="space-y-6 max-w-xl">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Agência</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure as credenciais e preferências da sua agência.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Integrações</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Google Analytics, Search Console, Meta Ads - conecte suas contas.
          </p>
        </div>
      </div>
    </Shell>
  );
}
