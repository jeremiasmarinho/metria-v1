import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium shadow-md transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_14px_hsl(var(--primary)/0.32)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_10px_24px_hsl(var(--primary)/0.38)]",
        destructive:
          "border border-destructive/25 bg-destructive text-destructive-foreground shadow-[0_4px_14px_hsl(var(--destructive)/0.28)] hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-[0_10px_24px_hsl(var(--destructive)/0.34)]",
        outline:
          "border border-zinc-300/90 bg-white/85 text-foreground shadow-[0_3px_10px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 hover:border-primary/45 hover:bg-white hover:text-foreground hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-900/80 dark:hover:bg-zinc-900",
        secondary:
          "border border-border/70 bg-secondary/90 text-secondary-foreground shadow-[0_3px_10px_rgba(15,23,42,0.14)] hover:-translate-y-0.5 hover:bg-secondary hover:shadow-lg",
        ghost:
          "border border-transparent text-foreground shadow-[0_2px_8px_rgba(15,23,42,0.08)] hover:bg-accent/80 hover:text-accent-foreground hover:border-border/60 hover:shadow-md",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-xl px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
