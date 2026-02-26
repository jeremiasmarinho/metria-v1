"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Empresa</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Acme Corp"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Identificador (Slug)</Label>
          <Input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Ex: acme-corp"
            required
          />
          <p className="text-xs text-muted-foreground">Usado nas URLs e internamente.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail de Contato</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contato@acme.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone / WhatsApp</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+55 11 99999-9999"
          />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="active" className="font-normal cursor-pointer">Cliente ativo (recebe relatórios)</Label>
        </div>
      </div>
      <Button type="submit" className="w-full">Salvar Cliente</Button>
    </form>
  );
}
