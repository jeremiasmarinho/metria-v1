import { Shell } from "@/components/layout/shell";
import Link from "next/link";

export default function SettingsPage() {
  const envStatus = (key: string) => !!process.env[key];

  return (
    <Shell title="Configurações">
      <div className="space-y-6 max-w-xl">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Agência</h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">AGENCY_ID</dt>
              <dd>{process.env.AGENCY_ID ? "✓ Configurado" : "✗ Falta"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Variáveis de Ambiente</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Configuradas no .env.local ou no Coolify.
          </p>
          <dl className="space-y-1 text-sm">
            {[
              ["Google OAuth", "GOOGLE_CLIENT_ID"],
              ["Meta OAuth", "META_APP_ID"],
              ["OpenAI", "OPENAI_API_KEY"],
              ["Cloudflare R2", "R2_ACCOUNT_ID"],
              ["Z-API (WhatsApp)", "ZAPI_INSTANCE_ID"],
              ["Resend (E-mail)", "RESEND_API_KEY"],
              ["Inngest", "INNGEST_EVENT_KEY"],
            ].map(([label, key]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{envStatus(key) ? "✓" : "✗"}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Integrações dos Clientes</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure tokens OAuth e IDs de propriedade na página de cada
            cliente.
          </p>
          <Link
            href="/clients"
            className="text-sm text-primary hover:underline mt-2 inline-block"
          >
            Ir para Clientes →
          </Link>
        </div>
      </div>
    </Shell>
  );
}
