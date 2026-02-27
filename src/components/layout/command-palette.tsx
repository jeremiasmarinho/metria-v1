"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  CornerDownLeft,
  LayoutDashboard,
  Users,
  PlusCircle,
  FileText,
  Settings,
  History,
  PlayCircle,
} from "lucide-react";
import { notify } from "@/lib/ui-feedback";

interface CommandItem {
  id: string;
  label: string;
  keywords: string;
  group: "Navegação" | "Clientes" | "Relatórios" | "Sistema";
  icon: ElementType;
  href?: string;
  action?: () => Promise<void> | void;
}

const BASE_ITEMS: Omit<CommandItem, "action">[] = [
  {
    id: "nav-dashboard",
    label: "Dashboard",
    href: "/dashboard",
    keywords: "home overview métricas performance visão geral",
    group: "Navegação",
    icon: LayoutDashboard,
  },
  {
    id: "nav-clients",
    label: "Clientes",
    href: "/clients",
    keywords: "clientes empresas contas",
    group: "Clientes",
    icon: Users,
  },
  {
    id: "clients-new",
    label: "Novo Cliente",
    href: "/clients/new",
    keywords: "novo adicionar cadastro",
    group: "Clientes",
    icon: PlusCircle,
  },
  {
    id: "reports-list",
    label: "Relatórios",
    href: "/reports",
    keywords: "relatório analytics desempenho pdf entregas",
    group: "Relatórios",
    icon: FileText,
  },
  {
    id: "system-settings",
    label: "Configurações",
    href: "/settings",
    keywords: "settings configurações chaves api ambiente integrações",
    group: "Sistema",
    icon: Settings,
  },
];

const RECENT_STORAGE_KEY = "metria-command-recent";

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [isRunningAction, setIsRunningAction] = useState(false);

  const saveRecent = (id: string) => {
    if (typeof window === "undefined") return;
    const next = [id, ...recent.filter((r) => r !== id)].slice(0, 4);
    setRecent(next);
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as string[];
      if (!Array.isArray(parsed)) return;
      // Backward compatibility: convert previous href-based recents to command IDs.
      const normalized = parsed
        .map((value) => BASE_ITEMS.find((i) => i.id === value || i.href === value)?.id ?? value)
        .slice(0, 4);
      setRecent(normalized);
    } catch {
      // ignore malformed local storage
    }
  }, []);

  const currentClientId = useMemo(() => {
    if (!pathname) return null;
    const match = pathname.match(/^\/clients\/([^/]+)$/);
    if (!match) return null;
    if (match[1] === "new") return null;
    return match[1];
  }, [pathname]);

  const items = useMemo<CommandItem[]>(() => {
    const dynamicItems: CommandItem[] = [
      ...BASE_ITEMS,
      {
        id: "reports-latest",
        label: "Abrir último relatório",
        keywords: "ultimo recente report abrir",
        group: "Relatórios",
        icon: History,
        action: async () => {
          const res = await fetch("/api/reports");
          if (!res.ok) throw new Error("Não foi possível carregar os relatórios.");
          const reports = (await res.json()) as Array<{ id: string }>;
          if (!Array.isArray(reports) || reports.length === 0) {
            notify({
              variant: "default",
              title: "Sem relatórios recentes",
              description: "Gere um relatório para habilitar este atalho.",
            });
            return;
          }
          router.push(`/reports/${reports[0].id}`);
        },
      },
      {
        id: "reports-rerun-latest",
        label: "Reprocessar último relatório",
        keywords: "reprocessar rerun executar novamente relatório",
        group: "Relatórios",
        icon: PlayCircle,
        action: async () => {
          const listRes = await fetch("/api/reports");
          if (!listRes.ok) throw new Error("Não foi possível listar os relatórios.");
          const reports = (await listRes.json()) as Array<{ id: string; clientId: string }>;
          if (!Array.isArray(reports) || reports.length === 0) {
            notify({
              variant: "default",
              title: "Sem relatórios para reprocessar",
              description: "Gere um relatório antes de usar este comando.",
            });
            return;
          }
          const runRes = await fetch(`/api/reports/${reports[0].id}/generate`, { method: "POST" });
          if (!runRes.ok) throw new Error("Não foi possível reprocessar o último relatório.");
          notify({
            variant: "success",
            title: "Reprocessamento iniciado",
            description: "O último relatório entrou em execução novamente.",
            actionLabel: "Abrir relatório",
            actionHref: `/reports/${reports[0].id}`,
          });
          router.push(`/reports/${reports[0].id}`);
        },
      },
      {
        id: "clients-open-recent",
        label: "Abrir cliente mais recente",
        keywords: "cliente recente ultimo abrir conta",
        group: "Clientes",
        icon: History,
        action: async () => {
          const res = await fetch("/api/clients");
          if (!res.ok) throw new Error("Não foi possível carregar os clientes.");
          const clients = (await res.json()) as Array<{ id: string; updatedAt?: string }>;
          if (!Array.isArray(clients) || clients.length === 0) {
            notify({
              variant: "default",
              title: "Sem clientes cadastrados",
              description: "Cadastre um cliente para habilitar este atalho.",
            });
            return;
          }
          const recentClient = [...clients].sort((a, b) => {
            const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return bt - at;
          })[0];
          router.push(`/clients/${recentClient.id}`);
        },
      },
    ];

    if (currentClientId) {
      dynamicItems.push({
        id: "clients-generate-current",
        label: "Gerar relatório do cliente atual",
        keywords: "gerar cliente atual pipeline report",
        group: "Clientes",
        icon: PlayCircle,
        action: async () => {
          const now = new Date();
          const period = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const createRes = await fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId: currentClientId, period: period.toISOString() }),
          });
          if (!createRes.ok) throw new Error("Não foi possível criar o relatório.");
          const report = (await createRes.json()) as { id: string };
          const runRes = await fetch(`/api/reports/${report.id}/generate`, { method: "POST" });
          if (!runRes.ok) throw new Error("Não foi possível iniciar a geração.");
          notify({
            variant: "success",
            title: "Relatório em processamento",
            description: "Pipeline iniciado para o cliente atual.",
            actionLabel: "Abrir relatório",
            actionHref: `/reports/${report.id}`,
          });
          router.push(`/reports/${report.id}`);
        },
      });
    }

    return dynamicItems;
  }, [currentClientId, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => `${item.label.toLowerCase()} ${item.keywords}`.includes(q));
  }, [query, items]);

  const visibleList = useMemo(() => {
    if (query || recent.length === 0) return filtered;
    const recents = recent
      .map((id) => items.find((item) => item.id === id))
      .filter(Boolean) as CommandItem[];
    const remaining = filtered.filter((item) => !recents.some((r) => r.id === item.id));
    return [...recents, ...remaining];
  }, [filtered, items, query, recent]);

  const recentItems = useMemo(
    () =>
      recent
        .map((id) => items.find((item) => item.id === id))
        .filter(Boolean) as CommandItem[],
    [recent, items]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    }
    return Array.from(map.entries());
  }, [filtered]);

  useEffect(() => {
    if (active > visibleList.length - 1) setActive(0);
  }, [active, visibleList.length]);

  const runCommand = async (item: CommandItem) => {
    if (isRunningAction) return;
    try {
      if (item.action) {
        setIsRunningAction(true);
        await item.action();
        saveRecent(item.id);
      } else if (item.href) {
        router.push(item.href);
        saveRecent(item.id);
      }
      setOpen(false);
      setQuery("");
      setActive(0);
    } catch (error) {
      notify({
        variant: "error",
        title: "Não foi possível executar este comando",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setIsRunningAction(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!open) return;

      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown") setActive((v) => v + 1);
      if (e.key === "ArrowUp") setActive((v) => Math.max(v - 1, 0));
      if (e.key === "Enter") {
        const item = visibleList[Math.min(active, Math.max(visibleList.length - 1, 0))];
        if (item) void runCommand(item);
      }
    };

    const onOpenRequest = () => {
      setOpen(true);
      setActive(0);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("app-command-open", onOpenRequest);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("app-command-open", onOpenRequest);
    };
  }, [open, active, visibleList, isRunningAction]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        aria-label="Fechar Command Palette"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div className="app-enter absolute left-1/2 top-[14vh] w-[min(92vw,680px)] -translate-x-1/2 rounded-2xl border border-border/60 bg-card/95 p-3 shadow-2xl backdrop-blur-xl">
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busque páginas, clientes, relatórios e ações..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>
        {isRunningAction && (
          <p className="mb-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-primary">
            Executando...
          </p>
        )}

        <div className="max-h-[48vh] overflow-auto rounded-xl border border-border/50 bg-background/50 p-1.5">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </div>
          ) : (
            <div className="space-y-2">
              {!query && recentItems.length > 0 && (
                <div className="rounded-lg border border-border/40 bg-muted/30 p-1.5">
                  <p className="mb-1 flex items-center gap-1 px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <History className="h-3 w-3" />
                    Recentes
                  </p>
                  {recentItems.map((item) => {
                    const Icon = item.icon;
                    const idx = visibleList.findIndex((v) => v.id === item.id);
                    return (
                      <button
                        key={`recent-${item.id}`}
                        onClick={() => void runCommand(item)}
                        disabled={isRunningAction}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all duration-200 ${
                          idx === active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2 text-sm font-medium">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {item.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          Abrir <CornerDownLeft className="h-3 w-3" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {grouped.map(([groupName, items]) => (
                <div key={groupName} className="rounded-lg border border-border/40 bg-background/40 p-1.5">
                  <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {groupName}
                  </p>
                  {items.map((item) => {
                    const idx = visibleList.findIndex((i) => i.id === item.id);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => void runCommand(item)}
                        disabled={isRunningAction}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all duration-200 ${
                          idx === active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2 text-sm font-medium">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {item.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          Abrir <CornerDownLeft className="h-3 w-3" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

