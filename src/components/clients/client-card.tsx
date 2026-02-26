import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Phone } from "lucide-react";

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
      <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
        <CardHeader className="pb-4 flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/10">
              <AvatarFallback className="bg-primary/5 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-semibold leading-tight">{name}</CardTitle>
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
          <Badge variant={active ? "default" : "secondary"} className={active ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
            {active ? "Ativo" : "Inativo"}
          </Badge>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Integrações:</span>
              <div className="flex gap-1.5">
                <Badge variant="outline" className={hasGoogle ? "border-blue-200 bg-blue-50 text-blue-700" : "text-muted-foreground opacity-50"}>
                  Google
                </Badge>
                <Badge variant="outline" className={hasMeta ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "text-muted-foreground opacity-50"}>
                  Meta
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm border-t pt-3">
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
