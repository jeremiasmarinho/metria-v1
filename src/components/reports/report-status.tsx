import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  INGESTING: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  ANALYZING: "bg-blue-100 text-blue-700",
  COMPILING: "bg-blue-100 text-blue-700",
  STORING: "bg-blue-100 text-blue-700",
  DELIVERING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  PARTIAL: "bg-yellow-100 text-yellow-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  INGESTING: "Coletando dados",
  PROCESSING: "Processando",
  ANALYZING: "Analisando",
  COMPILING: "Gerando PDF",
  STORING: "Armazenando",
  DELIVERING: "Enviando",
  COMPLETED: "Concluído",
  FAILED: "Falhou",
  PARTIAL: "Parcial",
};

interface ReportStatusProps {
  status: string;
  className?: string;
}

export function ReportStatus({ status, className }: ReportStatusProps) {
  const style = statusStyles[status] ?? "bg-gray-100 text-gray-700";
  const label = statusLabels[status] ?? status;
  return (
    <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs", style, className)}>
      {label}
    </span>
  );
}
