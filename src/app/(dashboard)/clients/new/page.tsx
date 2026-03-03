"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { notify } from "@/lib/ui-feedback";
import { OnboardingTour, resetOnboardingTour } from "@/components/clients/onboarding-tour";

export default function NewClientPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    active: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.error ?? "Não foi possível criar o cliente.";
        notify({ variant: "error", title: "Erro ao cadastrar", description: msg });
        return;
      }
      const client = await res.json();
      const connectionsRes = await fetch("/api/agency/connections");
      const connections =
        connectionsRes.ok
          ? ((await connectionsRes.json()) as { provider: string; status: string }[])
          : [];
      const hasMeta = connections.some((c) => c.provider === "META" && c.status === "CONNECTED");
      const hasGoogle = connections.some((c) => c.provider === "GOOGLE" && c.status === "CONNECTED");
      const openModal = hasMeta ? "meta" : hasGoogle ? "google" : undefined;
      const query = new URLSearchParams({ tab: "integrations" });
      if (openModal) query.set("openLinkModal", openModal);
      notify({
        variant: "success",
        title: "Cliente cadastrado",
        description: "Redirecionando para configurar integrações...",
      });
      router.push(`/clients/${client.id}?${query.toString()}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Card className="rounded-2xl border-border/70 shadow-sm transition-all duration-300 ease-in-out">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-normal text-muted-foreground">
              Passo 1 de 2
            </Badge>
          </div>
          <CardTitle>Novo cliente</CardTitle>
          <CardDescription>
            Cadastre os dados básicos. Em seguida, você será direcionado para conectar Google/Meta e ativar a automação de relatórios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <OnboardingTour />
          <ClientForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="text-sm flex-1 min-w-0">
              <p className="font-medium">O que acontece depois de salvar</p>
              <p className="text-blue-700 dark:text-blue-300 mt-0.5">
                Você será redirecionado para a aba Integrações. Se a agência já tiver Google ou Meta conectados, o modal de vinculação abrirá automaticamente.
              </p>
              <button
                type="button"
                onClick={() => {
                  resetOnboardingTour();
                  window.location.reload();
                }}
                className="mt-2 text-xs underline hover:no-underline text-blue-600 dark:text-blue-400"
              >
                Ver tour novamente
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
