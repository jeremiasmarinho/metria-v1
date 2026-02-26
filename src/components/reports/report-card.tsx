import Link from "next/link";
import { ReportStatus } from "./report-status";

interface ReportCardProps {
  id: string;
  clientName: string;
  period: string;
  status: string;
}

export function ReportCard({ id, clientName, period, status }: ReportCardProps) {
  return (
    <Link href={`/reports/${id}`}>
      <div className="rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer">
        <h3 className="font-medium">{clientName}</h3>
        <p className="text-sm text-muted-foreground">{period}</p>
        <ReportStatus status={status} className="mt-2" />
      </div>
    </Link>
  );
}
