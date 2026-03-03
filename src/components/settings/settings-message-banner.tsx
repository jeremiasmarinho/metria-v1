"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

export function SettingsMessageBanner() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(t);
    }
  }, [message]);

  if (!visible || !message) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
    >
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p className="text-sm font-medium">{decodeURIComponent(message)}</p>
    </div>
  );
}
