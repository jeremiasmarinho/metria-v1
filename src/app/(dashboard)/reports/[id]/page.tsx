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
          
          <div className="flex items-center gap-4">
            <ReportStatus status={report.status} />
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
                Baixar PDF
              </a>
            )}
          </div>
          </div>
        </section>

        {report.errorMessage && (
          <div className="app-enter app-enter-delay-1 flex gap-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-5 shadow-sm transition-all duration-300 ease-in-out">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive mb-1">Falha na geração</h3>
              <p className="text-sm text-destructive/90">{report.errorMessage}</p>
            </div>
          </div>
        )}

        <Card className="app-enter app-enter-delay-2 rounded-2xl border-border/70 shadow-sm transition-all duration-300 ease-in-out">
          <CardHeader className="border-b bg-muted/30">
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
