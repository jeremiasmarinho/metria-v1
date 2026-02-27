"use client";

export type AppToastVariant = "default" | "success" | "error";

export interface AppToastPayload {
  title: string;
  description?: string;
  variant?: AppToastVariant;
  actionLabel?: string;
  actionHref?: string;
}

export function notify(payload: AppToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app-toast", { detail: payload }));
}

export function openCommandPalette() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("app-command-open"));
}

