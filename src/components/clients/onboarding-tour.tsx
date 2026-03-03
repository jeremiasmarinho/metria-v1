"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, X } from "lucide-react";

export const TOUR_STORAGE_KEY = "metria-onboarding-tour-new-client";

/** Limpa o estado do tour para exibir novamente na próxima visita. */
export function resetOnboardingTour() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  }
}

const STEPS = [
  {
    id: "step1",
    title: "Passo 1: Dados básicos",
    description: "Preencha o nome, slug, e-mail e telefone do cliente. O slug será usado em URLs e automações.",
  },
  {
    id: "step2",
    title: "Passo 2: Salvar e integrar",
    description: "Ao clicar em Salvar, você será redirecionado para a aba Integrações para conectar Google Ads e Meta.",
  },
  {
    id: "step3",
    title: "Pronto!",
    description: "Depois de vincular as contas, o sistema poderá gerar relatórios automaticamente para este cliente.",
  },
];

export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const dismissed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, [mounted]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "dismissed");
  };

  if (!visible || !mounted) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-label="Tour de cadastro"
      className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-primary">
              {step + 1} de {STEPS.length}
            </span>
          </div>
          <h4 className="font-semibold text-foreground">{current.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{current.description}</p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Fechar tour"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-muted-foreground"
        >
          Pular tour
        </Button>
        <Button type="button" size="sm" onClick={handleNext}>
          {isLast ? "Entendi" : "Próximo"}
          {!isLast && <ChevronRight className="ml-1 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
