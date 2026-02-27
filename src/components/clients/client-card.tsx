import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClientCardActions } from "./client-card-actions";

interface ClientCardProps {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  email?: string | null;
  hasGoogle?: boolean;
  hasMeta?: boolean;
  lastReportDate?: Date;
}

export function ClientCard({ 
  id, 
  name, 
  slug, 
  active, 
  email,
  hasGoogle,
  hasMeta,
  lastReportDate
}: ClientCardProps) {
  const initials = name.substring(0, 2).toUpperCase();
  
  return (
    <Card className="app-interactive flex h-full flex-col rounded-xl border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--card)/0.97))] shadow-md">
      <CardHeader className="pb-4 flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-primary/20 shadow-sm transition-all duration-300 ease-in-out">
            <AvatarFallback className="bg-primary/5 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base font-semibold leading-tight tracking-tight text-foreground">{name}</CardTitle>
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              {email ? (
                <span className="flex items-center truncate max-w-[140px]">
                  <Mail className="mr-1 h-3 w-3" />
                  {email}
                </span>
              ) : (
                <span className="truncate max-w-[140px]">@{slug}</span>
              )}
            </div>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`transition-all duration-300 ease-out ${
            active
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {active ? "Ativo" : "Inativo"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Integrações:</span>
            <div className="flex gap-1.5">
              <Badge
                variant="outline"
                className={`transition-all duration-300 ease-out ${
                  hasGoogle
                    ? "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400"
                    : "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Google
              </Badge>
              <Badge
                variant="outline"
                className={`transition-all duration-300 ease-out ${
                  hasMeta
                    ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                    : "border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Meta
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-border/50 pt-3 text-sm">
            <span className="flex items-center text-muted-foreground">
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              Último relatório:
            </span>
            <span className="font-medium">
              {lastReportDate 
                ? new Date(lastReportDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                : "Ainda não gerado"}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <Link
              href={`/clients/${id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 px-2.5")}
            >
              Abrir
            </Link>
            <ClientCardActions clientId={id} clientName={name} active={active} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
