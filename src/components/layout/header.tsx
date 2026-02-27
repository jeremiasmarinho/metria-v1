import Link from "next/link";
import { ChevronRight, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-300 ease-in-out hover:bg-primary/10 hover:text-primary md:hidden"
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
                    className="rounded-md px-1.5 py-1 transition-all duration-300 ease-in-out hover:bg-primary/10 hover:text-primary"
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
        <span className="hidden text-sm capitalize text-muted-foreground sm:inline">{today}</span>
        <Badge
          variant="outline"
          className="border-green-200 bg-green-50 text-green-700 shadow-sm transition-all duration-300 ease-in-out hover:bg-green-50"
        >
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-500" />
          <span className="hidden sm:inline">Sistema </span>Online
        </Badge>
      </div>
    </header>
  );
}
