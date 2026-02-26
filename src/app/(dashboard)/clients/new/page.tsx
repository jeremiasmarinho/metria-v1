"use client";

import { useRouter } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";

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
      alert(err.error ?? "Erro ao criar cliente");
      return;
    }
    const client = await res.json();
    router.push(`/clients/${client.id}`);
    router.refresh();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Novo cliente</h2>
      <ClientForm onSubmit={handleSubmit} />
    </div>
  );
}
