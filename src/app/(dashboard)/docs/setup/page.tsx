import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SetupGuidePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Configurações
      </Link>

      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Guia de instalação</h1>
        <p className="text-muted-foreground">
          Para o &quot;Conectar conta pai&quot; funcionar, o administrador do servidor precisa configurar as credenciais OAuth uma vez. Após isso, os usuários só precisam clicar em Conectar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Google Ads / GA4 / Search Console</CardTitle>
          <CardDescription>Credenciais necessárias para conectar contas Google</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a>.</li>
            <li>Crie um projeto ou selecione um existente.</li>
            <li>Ative as APIs: Google Ads API, Google Analytics Data API, Search Console API.</li>
            <li>Em &quot;Credenciais&quot; → &quot;Tela de consentimento OAuth&quot;, configure o app (tipo externo).</li>
            <li>Crie credenciais OAuth 2.0 (tipo &quot;Aplicação da Web&quot;). Adicione o redirect: <code className="rounded bg-muted px-1">&#123;NEXTAUTH_URL&#125;/api/oauth/google/callback</code></li>
            <li>Adicione ao <code className="rounded bg-muted px-1">.env</code>:<br />
              <code className="block mt-2 p-3 rounded-lg bg-muted text-xs">
                GOOGLE_CLIENT_ID=&quot;...&quot;<br />
                GOOGLE_CLIENT_SECRET=&quot;...&quot;
              </code>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meta Business / Meta Ads</CardTitle>
          <CardDescription>Credenciais necessárias para conectar contas Meta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Acesse o <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Meta for Developers</a>.</li>
            <li>Crie um app do tipo &quot;Business&quot;.</li>
            <li>Adicione o produto &quot;Facebook Login&quot; e configure &quot;Login com JavaScript&quot;.</li>
            <li>Em &quot;Configurações&quot; → &quot;Básico&quot;, copie o ID do App e o App Secret.</li>
            <li>Configure o URL de redirecionamento OAuth: <code className="rounded bg-muted px-1">&#123;NEXTAUTH_URL&#125;/api/oauth/meta/callback</code></li>
            <li>Adicione ao <code className="rounded bg-muted px-1">.env</code>:<br />
              <code className="block mt-2 p-3 rounded-lg bg-muted text-xs">
                META_APP_ID=&quot;...&quot;<br />
                META_APP_SECRET=&quot;...&quot;
              </code>
            </li>
          </ol>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Após configurar e reiniciar a aplicação, os botões &quot;Conectar&quot; estarão disponíveis na página de Configurações.
      </p>
    </div>
  );
}
