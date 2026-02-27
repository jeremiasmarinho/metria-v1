import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Database, Key, Server, Mail, MessageCircle, Cloud, Sparkles, Users } from "lucide-react";

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
      <section className="app-section app-enter">
        <div className="app-section-body">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Configurações do Sistema</h2>
        <p className="text-sm text-muted-foreground">
          Garanta que tudo está pronto para gerar, armazenar e entregar relatórios com consistência.
        </p>
        </div>
      </section>

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
            <CardDescription>Conecte fontes e destrave insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="app-table-shell">
              <div className="app-table-row">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google OAuth
                </div>
                <StatusBadge isOk={envStatus("GOOGLE_CLIENT_ID")} />
              </div>
              <div className="app-table-row">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <svg className="h-4 w-4 text-[#0668E1]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  Meta OAuth
                </div>
                <StatusBadge isOk={envStatus("META_APP_ID")} />
              </div>
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
