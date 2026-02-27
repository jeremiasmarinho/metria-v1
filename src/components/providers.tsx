"use client";

import { SessionProvider } from "next-auth/react";
import { ToastCenter } from "@/components/ui/toast-center";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ToastCenter />
    </SessionProvider>
  );
}
