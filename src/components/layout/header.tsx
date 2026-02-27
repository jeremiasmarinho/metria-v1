import Link from "next/link";
import { ChevronRight, Command, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { openCommandPalette } from "@/lib/ui-feedback";

interface HeaderProps {
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onMenuClick?: () => void;
}

export function Header({ title, breadcrumbs, onMenuClick }: HeaderProps) {
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="sticky top-0 z-50 bg-transparent px-4 pt-4 md:px-8">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-4 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-300 ease-in-out hover:bg-primary/15 hover:text-primary md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="mx-2 h-4 w-4" />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="rounded-md px-1.5 py-1 transition-all duration-300 ease-in-out hover:bg-primary/15 hover:text-primary"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        ) : (
          <h1 className="text-lg font-semibold text-foreground">{title ?? "Metria"}</h1>
        )}
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden h-5 w-px bg-border/60 sm:inline-block" />
          <button
            type="button"
            onClick={openCommandPalette}
            className="hidden items-center gap-1 rounded-lg border border-border/70 bg-background/70 px-2.5 py-1 text-xs text-muted-foreground transition-all duration-200 hover:border-primary/35 hover:text-foreground sm:inline-flex"
          >
            <Command className="h-3.5 w-3.5" />
            K
          </button>
          <span className="hidden text-sm capitalize text-muted-foreground sm:inline">{today}</span>
          <Badge
            variant="outline"
            className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 shadow-none transition-all duration-300 ease-in-out dark:text-emerald-400"
          >
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-500" />
            <span className="hidden sm:inline">Operação </span>online
          </Badge>
        </div>
      </div>
    </header>
  );
}
