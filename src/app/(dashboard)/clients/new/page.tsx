"use client";

import { useRouter } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewClientPage() {
  const router = useRouter();

  const handleSubmit = async (data: {
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    active: boolean;
  }) => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Não foi possível criar o cliente.");
      return;
    }
    const client = await res.json();
    router.push(`/clients/${client.id}`);
    router.refresh();
  };

  return (
    <div className="max-w-2xl">
      <Card className="rounded-2xl border-border/70 shadow-sm transition-all duration-300 ease-in-out">
        <CardHeader>
          <CardTitle>Novo cliente</CardTitle>
          <CardDescription>
            Cadastre a conta e, em seguida, conecte Google/Meta para ativar a automação de relatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
