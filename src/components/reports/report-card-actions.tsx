"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/ui-feedback";

interface ReportCardActionsProps {
  reportId: string;
  clientName: string;
  period: string;
}

export function ReportCardActions({
  reportId,
  clientName,
  period,
}: ReportCardActionsProps) {
  const router = useRouter();
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    setLoadingDelete(true);
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Não foi possível excluir o relatório.");
      }

      notify({
        variant: "success",
        title: "Relatório excluído",
        description: `O relatório de ${clientName} (${period}) foi removido com sucesso.`,
      });

      setConfirmOpen(false);
      router.refresh();
    } catch (error) {
      notify({
        variant: "error",
        title: "Falha ao excluir relatório",
        description:
          error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirmOpen(true);
        }}
        aria-label="Excluir relatório"
      >
        <Trash2 className="h-4 w-4" />
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
                  <h3 className="text-base font-semibold text-foreground">
                    Tem certeza que deseja excluir este relatório?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Esta ação não pode ser desfeita. O relatório de{" "}
                    <span className="font-medium text-foreground">{clientName}</span>{" "}
                    ({period}) será removido permanentemente.
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
                  {loadingDelete ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    "Excluir relatório"
                  )}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
