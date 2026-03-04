import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ReportStatus } from "@/components/reports/report-status";
import { Download, FileDown, AlertTriangle, Sparkles } from "lucide-react";
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
      <div className="max-w-3xl space-y-6">
        <section className="app-section app-enter">
          <div className="app-section-body flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">{report.client.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {report.period.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}
              </span>
              <span>•</span>
              <span>Gerado em {report.createdAt.toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <ReportStatus status={report.status} />
            <div className="flex items-center gap-4">
              {report.pdfUrl && (
                <a
                  href={report.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "rounded-xl shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md"
                  )}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF  do Cliente
                </a>
              )}
              {report.aiAnalysisInternal && (
                <a
                  href={`/api/reports/${report.id}/internal-pdf`}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "rounded-xl shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md",
                    "border-0 bg-amber-500 text-white shadow-[0_4px_14px_hsl(38_92%_50%/0.35)] hover:bg-amber-600 hover:shadow-[0_10px_24px_hsl(38_92%_50%/0.4)]"
                  )}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Baixar PDF Interno
                </a>
              )}
            </div>
          </div>
          </div>
        </section>

        {report.aiAnalysisInternal && (
          <Card className="app-enter app-enter-delay-1 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 shadow-lg">
            <CardHeader className="border-b border-amber-500/20 bg-slate-950/40">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">🔥</span>
                  <CardTitle className="text-base sm:text-lg">
                    Visão da Agência (Uso Interno)
                  </CardTitle>
                </div>
                <span className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
                  O cliente não vê estas informações no PDF.
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100/90">
                {report.aiAnalysisInternal}
              </p>
            </CardContent>
          </Card>
        )}

        {report.errorMessage && (
          <div className="app-enter app-enter-delay-2 flex gap-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-5 shadow-sm transition-all duration-300 ease-in-out">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive mb-1">Falha na geração</h3>
              <p className="text-sm text-destructive/90">{report.errorMessage}</p>
            </div>
          </div>
        )}

        <Card className="app-enter app-enter-delay-3 rounded-2xl border-border/70 shadow-sm transition-all duration-300 ease-in-out">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <CardTitle>Análise Executiva (Cliente)</CardTitle>
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
                  <p>Analisando os dados e preparando insights executivos...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
