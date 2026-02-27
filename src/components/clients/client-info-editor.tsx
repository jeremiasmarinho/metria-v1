"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/lib/ui-feedback";

interface ClientInfoEditorProps {
  client: {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export function ClientInfoEditor({ client }: ClientInfoEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(client.name);
  const [slug, setSlug] = useState(client.slug);
  const [email, setEmail] = useState(client.email ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [active, setActive] = useState(client.active);

  const resetForm = () => {
    setName(client.name);
    setSlug(client.slug);
    setEmail(client.email ?? "");
    setPhone(client.phone ?? "");
    setActive(client.active);
  };

  const handleCancel = () => {
    resetForm();
    setIsEditing(false);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          email,
          phone,
          active,
        }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível atualizar os dados do cliente.");
      }

      notify({
        variant: "success",
        title: "Dados atualizados",
        description: "As informações do cliente foram salvas com sucesso.",
      });

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      notify({
        variant: "error",
        title: "Falha ao salvar alterações",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border/70 shadow-md transition-all duration-300 ease-in-out">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Dados do Cliente</CardTitle>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" form="client-info-edit-form" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Editar
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <form id="client-info-edit-form" onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client-name">Nome da empresa</Label>
                <Input
                  id="client-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-slug">Slug (identificador)</Label>
                <Input
                  id="client-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-email">E-mail de contato</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-phone">Telefone / WhatsApp</Label>
                <Input
                  id="client-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+55 11 99999-9999"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="client-active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-border/80 bg-background shadow-sm transition-all duration-200 ease-in-out accent-primary hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
              />
              <Label htmlFor="client-active" className="cursor-pointer font-normal">
                Cliente ativo (recebe relatórios)
              </Label>
            </div>
          </form>
        ) : (
          <dl className="app-table-shell text-sm">
            <div className="app-table-row flex-col items-start gap-1 sm:flex-row sm:items-center">
              <dt className="font-semibold text-foreground">Nome da Empresa</dt>
              <dd className="text-muted-foreground">{client.name}</dd>
            </div>
            <div className="app-table-row flex-col items-start gap-1 sm:flex-row sm:items-center">
              <dt className="font-semibold text-foreground">Slug (Identificador)</dt>
              <dd className="font-mono text-muted-foreground">{client.slug}</dd>
            </div>
            <div className="app-table-row flex-col items-start gap-1 sm:flex-row sm:items-center">
              <dt className="font-semibold text-foreground">E-mail de Contato</dt>
              <dd className="text-muted-foreground">{client.email ?? "Não informado"}</dd>
            </div>
            <div className="app-table-row flex-col items-start gap-1 sm:flex-row sm:items-center">
              <dt className="font-semibold text-foreground">Telefone / WhatsApp</dt>
              <dd className="text-muted-foreground">{client.phone ?? "Não informado"}</dd>
            </div>
            <div className="app-table-row flex-col items-start gap-1 sm:flex-row sm:items-center">
              <dt className="font-semibold text-foreground">Data de Cadastro</dt>
              <dd className="text-muted-foreground">
                {new Date(client.createdAt).toLocaleString("pt-BR")}
              </dd>
            </div>
            <div className="app-table-row flex-col items-start gap-1 sm:flex-row sm:items-center">
              <dt className="font-semibold text-foreground">Última Atualização</dt>
              <dd className="text-muted-foreground">
                {new Date(client.updatedAt).toLocaleString("pt-BR")}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

