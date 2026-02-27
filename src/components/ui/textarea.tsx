import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[96px] w-full rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.10),0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300 ease-in-out placeholder:text-muted-foreground/90 hover:border-primary/35 hover:shadow-[0_2px_6px_rgba(59,130,246,0.12),0_12px_28px_rgba(15,23,42,0.10)] focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:shadow-[0_0_0_4px_rgba(59,130,246,0.12),0_12px_30px_rgba(15,23,42,0.14)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };

