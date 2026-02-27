import Link from "next/link";
import { ReportStatus } from "./report-status";
import { ChevronRight, Calendar } from "lucide-react";

interface ReportCardProps {
  id: string;
  clientName: string;
  period: string;
  status: string;
}

export function ReportCard({ id, clientName, period, status }: ReportCardProps) {
  return (
    <Link href={`/reports/${id}`} className="block">
      <div className="app-interactive group flex cursor-pointer items-center justify-between rounded-2xl border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--card)/0.97))] p-4 shadow-md">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold leading-none tracking-tight text-foreground">{clientName}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            {period}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ReportStatus status={status} />
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-all duration-300 ease-in-out group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}
