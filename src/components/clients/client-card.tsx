import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail } from "lucide-react";

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
    <Link href={`/clients/${id}`}>
      <Card className="h-full cursor-pointer bg-card rounded-xl border border-border/50 shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:border-primary/20 hover:-translate-y-[2px] flex flex-col">
        <CardHeader className="pb-4 flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-primary/20 shadow-sm transition-all duration-300 ease-in-out">
              <AvatarFallback className="bg-primary/5 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-semibold leading-tight text-foreground">{name}</CardTitle>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
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
        <CardContent className="flex-1 flex flex-col justify-end">
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
            
            <div className="flex items-center justify-between text-sm border-t border-border/50 pt-3">
              <span className="text-muted-foreground flex items-center">
                <Calendar className="mr-1.5 h-3.5 w-3.5" />
                Último relatório:
              </span>
              <span className="font-medium">
                {lastReportDate 
                  ? new Date(lastReportDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                  : "Nenhum"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
