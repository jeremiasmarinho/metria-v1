import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ReportStatus } from "@/components/reports/report-status";
import { Download, AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div>
      <div className="space-y-6 max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-xl p-6 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">{report.client.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {report.period.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}
              </span>
              <span>•</span>
              <span>Gerado em {report.createdAt.toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <ReportStatus status={report.status} />
            {report.pdfUrl && (
              <a
                href={report.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ size: "lg" }), "shadow-sm")}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </a>
            )}
          </div>
        </div>

        {report.errorMessage && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 flex gap-4">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive mb-1">Falha na geração</h3>
              <p className="text-sm text-destructive/90">{report.errorMessage}</p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <CardTitle>Análise Executiva</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-sm md:prose-base max-w-none text-muted-foreground">
              {report.aiAnalysis ? (
                <p className="whitespace-pre-wrap leading-relaxed">
                  {report.aiAnalysis}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground/60">
                  <Sparkles className="h-8 w-8 mb-3 opacity-20" />
                  <p>Aguardando análise da inteligência artificial...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
