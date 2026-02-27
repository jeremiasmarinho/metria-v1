import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2, AlertCircle, Clock } from "lucide-react";

const statusConfig: Record<string, { style: string; label: string; icon: React.ElementType }> = {
  PENDING: { style: "bg-gray-100 text-gray-700 border-gray-200", label: "Em fila", icon: Clock },
  INGESTING: { style: "bg-blue-100 text-blue-700 border-blue-200", label: "Coletando dados", icon: Loader2 },
  PROCESSING: { style: "bg-blue-100 text-blue-700 border-blue-200", label: "Processando", icon: Loader2 },
  ANALYZING: { style: "bg-blue-100 text-blue-700 border-blue-200", label: "Analisando", icon: Loader2 },
  COMPILING: { style: "bg-blue-100 text-blue-700 border-blue-200", label: "Gerando PDF", icon: Loader2 },
  STORING: { style: "bg-blue-100 text-blue-700 border-blue-200", label: "Armazenando", icon: Loader2 },
  DELIVERING: { style: "bg-blue-100 text-blue-700 border-blue-200", label: "Enviando", icon: Loader2 },
  COMPLETED: { style: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Concluído", icon: CheckCircle2 },
  FAILED: { style: "bg-red-100 text-red-700 border-red-200", label: "Erro", icon: XCircle },
  PARTIAL: { style: "bg-amber-100 text-amber-700 border-amber-200", label: "Parcial", icon: AlertCircle },
};

interface ReportStatusProps {
  status: string;
  className?: string;
}

export function ReportStatus({ status, className }: ReportStatusProps) {
  const config = statusConfig[status] ?? statusConfig.PENDING;
  const Icon = config.icon;
  const isSpinning = config.icon === Loader2;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium shadow-sm transition-all duration-300 ease-in-out",
        config.style,
        className
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", isSpinning && "animate-spin")} />
      {config.label}
    </span>
  );
}
