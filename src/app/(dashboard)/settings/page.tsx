import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Database, Key, Server, Mail, MessageCircle, Cloud, Sparkles, Users } from "lucide-react";
import { AgencyConnections } from "@/components/settings/agency-connections";
import { SettingsMessageBanner } from "@/components/settings/settings-message-banner";

function StatusBadge({ isOk }: { isOk: boolean }) {
  return (
    <Badge
      variant="outline"
      className={`transition-all duration-300 ease-in-out ${isOk ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300" : "border-destructive/30 bg-destructive/10 text-destructive"}`}
    >
      {isOk ? (
        <><CheckCircle2 className="w-3 h-3 mr-1" /> Configurado</>
      ) : (
        <><XCircle className="w-3 h-3 mr-1" /> Faltando</>
      )}
    </Badge>
  );
}

export default function SettingsPage() {
  const envStatus = (key: string) => !!process.env[key];

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <SettingsMessageBanner />
      </Suspense>
      <section className="app-section app-enter">
        <div className="app-section-body">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Configurações do Sistema</h2>
        <p className="text-sm text-muted-foreground">
          Garanta que tudo está pronto para gerar, armazenar e entregar relatórios com consistência.
          <Link href="/docs/setup" className="ml-1 text-primary hover:underline">
            Guia de instalação
          </Link>
        </p>
        </div>
      </section>

      <Suspense fallback={null}>
        <AgencyConnections />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Infraestrutura */}
        <Card className="app-enter app-enter-delay-1 rounded-2xl border-border/70 shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Infraestrutura</CardTitle>
            </div>
            <CardDescription>Fundação do ambiente e segurança</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="app-table-shell">
              <div className="app-table-row">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  Neon DB
                </div>
                <StatusBadge isOk={envStatus("DATABASE_URL")} />
              </div>
              <div className="app-table-row">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  Auth Secret
                </div>
                <StatusBadge isOk={envStatus("NEXTAUTH_SECRET")} />
              </div>
              <div className="app-table-row">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  Encryption Key
                </div>
                <StatusBadge isOk={envStatus("ENCRYPTION_KEY")} />
              </div>
              <div className="app-table-row">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Agency ID
                </div>
                <StatusBadge isOk={envStatus("AGENCY_ID")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* APIs Externas */}
        <Card className="app-enter app-enter-delay-2 rounded-2xl border-border/70 shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">APIs de Dados</CardTitle>
            </div>
            <CardDescription>APIs utilizadas na geração de relatórios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="app-table-shell">
              <div className="app-table-row">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  OpenAI (GPT-4o)
                </div>
                <StatusBadge isOk={envStatus("OPENAI_API_KEY")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entrega e Storage */}
        <Card className="app-enter app-enter-delay-3 rounded-2xl border-border/70 shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Entrega & Storage</CardTitle>
            </div>
            <CardDescription>Entrega multicanal e cofre de relatórios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="app-table-shell">
              <div className="app-table-row">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Cloud className="h-4 w-4 text-muted-foreground" />
                  Cloudflare R2
                </div>
                <StatusBadge isOk={envStatus("R2_ACCOUNT_ID")} />
              </div>
              <div className="app-table-row">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Resend (E-mail)
                </div>
                <StatusBadge isOk={envStatus("RESEND_API_KEY")} />
              </div>
              <div className="app-table-row">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  Z-API (WhatsApp)
                </div>
                <StatusBadge isOk={envStatus("ZAPI_INSTANCE_ID")} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
