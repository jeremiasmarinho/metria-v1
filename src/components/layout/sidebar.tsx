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
    <aside className="flex h-full w-64 flex-col border-r border-zinc-800/80 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100 shadow-2xl">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800/70 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md transition-all duration-300 ease-in-out">
          M
        </div>
        <span className="text-lg font-semibold tracking-tight text-zinc-50">Metria</span>
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
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200",
                isActive
                  ? "bg-primary/20 font-semibold text-primary-foreground shadow-sm ring-1 ring-primary/30"
                  : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-800/70 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-9 w-9 border border-zinc-700 shadow-md">
              <AvatarFallback className="bg-primary/20 text-primary-foreground font-medium">
                {getInitials(session?.user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-zinc-100">
                {session?.user?.name ?? "Usuário"}
              </span>
              <span className="truncate text-xs text-zinc-400">
                {session?.user?.email ?? "—"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
