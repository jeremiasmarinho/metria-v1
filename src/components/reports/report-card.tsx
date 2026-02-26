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
    <Link href={`/reports/${id}`}>
      <div className="group flex items-center justify-between rounded-lg border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-semibold text-base leading-none">{clientName}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            {period}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ReportStatus status={status} />
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}
