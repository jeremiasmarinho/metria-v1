"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Power, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/ui-feedback";

interface ClientCardActionsProps {
  clientId: string;
  clientName: string;
  active: boolean;
}

export function ClientCardActions({ clientId, clientName, active }: ClientCardActionsProps) {
  const router = useRouter();
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleToggleActive = async () => {
    setLoadingToggle(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });

      if (!response.ok) {
        throw new Error("Não foi possível atualizar o status do cliente.");
      }

      notify({
        variant: "success",
        title: !active ? "Cliente ativado" : "Cliente inativado",
        description: `${clientName} foi ${!active ? "ativado" : "inativado"} com sucesso.`,
      });

      router.refresh();
    } catch (error) {
      notify({
        variant: "error",
        title: "Falha ao atualizar status",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setLoadingToggle(false);
    }
  };

  const handleDelete = async () => {
    setLoadingDelete(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Não foi possível excluir o cliente.");
      }

      notify({
        variant: "success",
        title: "Cliente excluído",
        description: `${clientName} foi removido com sucesso.`,
      });

      setConfirmOpen(false);
      router.refresh();
    } catch (error) {
      notify({
        variant: "error",
        title: "Falha ao excluir cliente",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleToggleActive}
        disabled={loadingToggle || loadingDelete}
        className="h-8 px-2.5"
      >
        <Power className="mr-1.5 h-3.5 w-3.5" />
        {active ? "Inativar" : "Ativar"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={() => setConfirmOpen(true)}
        disabled={loadingToggle || loadingDelete}
        className="h-8 px-2.5"
      >
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        Excluir
      </Button>

      {confirmOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-black/55"
              onClick={() => !loadingDelete && setConfirmOpen(false)}
              aria-label="Fechar confirmação de exclusão"
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-md rounded-2xl border border-border/70 bg-card p-5 shadow-2xl"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Confirmar exclusão</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Você está prestes a excluir{" "}
                    <span className="font-medium text-foreground">{clientName}</span>. Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmOpen(false)}
                  disabled={loadingDelete}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loadingDelete}
                >
                  {loadingDelete ? "Excluindo..." : "Excluir cliente"}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

