"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ClientFormProps {
  defaultValues?: {
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    active: boolean;
  };
  onSubmit: (data: {
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    active: boolean;
  }) => void;
}

export function ClientForm({ defaultValues, onSubmit }: ClientFormProps) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [slug, setSlug] = useState(defaultValues?.slug ?? "");
  const [email, setEmail] = useState(defaultValues?.email ?? "");
  const [phone, setPhone] = useState(defaultValues?.phone ?? "");
  const [active, setActive] = useState(defaultValues?.active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, slug, email: email || undefined, phone: phone || undefined, active });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium mb-1">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Telefone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="active"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        <label htmlFor="active">Cliente ativo</label>
      </div>
      <Button type="submit">Salvar</Button>
    </form>
  );
}
