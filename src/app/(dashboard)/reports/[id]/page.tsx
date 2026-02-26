import { db } from "@/lib/db";
import { Shell } from "@/components/layout/shell";
import { notFound } from "next/navigation";
import { ReportStatus } from "@/components/reports/report-status";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const report = await db.report.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!report) notFound();

  return (
    <Shell title={`Relatório - ${report.client.name}`}>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <ReportStatus status={report.status} />
          {report.pdfUrl && (
            <Link
              href={report.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Baixar PDF
            </Link>
          )}
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-2">Análise executiva</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {report.aiAnalysis ?? "Aguardando análise..."}
          </p>
        </div>
        {report.errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="font-medium text-red-800">Erro</h3>
            <p className="text-sm text-red-700 mt-1">{report.errorMessage}</p>
          </div>
        )}
      </div>
    </Shell>
  );
}
