"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, Users, FileText, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/reports", label: "Relatórios", icon: FileText },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border/50 bg-muted/30 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-all duration-300 ease-in-out">
          M
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">Metria</span>
      </div>
      <nav className="flex-1 space-y-1.5 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-9 w-9 border border-border/60 shadow-sm transition-all duration-300 ease-in-out">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(session?.user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-foreground">
                {session?.user?.name ?? "Utilizador"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {session?.user?.email ?? "—"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-xl p-2 text-muted-foreground transition-all duration-300 ease-in-out hover:bg-primary/10 hover:text-primary"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
