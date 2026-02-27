"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppToastPayload } from "@/lib/ui-feedback";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface ToastItem extends AppToastPayload {
  id: string;
}

export function ToastCenter() {
  const router = useRouter();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const custom = event as CustomEvent<AppToastPayload>;
      const payload = custom.detail;
      if (!payload?.title) return;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [{ id, ...payload }, ...prev].slice(0, 4));

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    };

    window.addEventListener("app-toast", onToast);
    return () => window.removeEventListener("app-toast", onToast);
  }, []);

  const styleFor = useMemo(
    () => ({
      default:
        "border-border/70 bg-card/95 text-foreground",
      success:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      error:
        "border-destructive/30 bg-destructive/10 text-destructive",
    }),
    []
  );

  const iconFor = (variant: AppToastPayload["variant"]) => {
    if (variant === "success") return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />;
    if (variant === "error") return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />;
    return <Info className="mt-0.5 h-4 w-4 shrink-0" />;
  };

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2 md:right-6 md:top-6">
      {toasts.map((toast) => {
        const variant = toast.variant ?? "default";
        return (
          <div
            key={toast.id}
            className={`app-enter pointer-events-auto rounded-xl border p-3 shadow-lg backdrop-blur-sm ${styleFor[variant]}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex gap-2.5">
              {iconFor(variant)}
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-xs leading-relaxed opacity-85">{toast.description}</p>
                )}
                {toast.actionLabel && toast.actionHref && (
                  <button
                    type="button"
                    onClick={() => router.push(toast.actionHref!)}
                    className="mt-2 inline-flex rounded-md border border-current/20 px-2 py-1 text-[11px] font-medium transition-all duration-200 hover:bg-current/10"
                  >
                    {toast.actionLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

