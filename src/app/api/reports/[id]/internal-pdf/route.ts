import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { processClientMetrics } from "@/lib/pipeline/process";
import { compileInternalReportPdf } from "@/lib/pipeline/compile-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  }

  const report = await db.report.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!report) {
    return NextResponse.json(
      { error: "Relatório não encontrado." },
      { status: 404 }
    );
  }

  if (report.agencyId !== auth.user.agencyId) {
    return NextResponse.json(
      { error: "Sem permissão para baixar este relatório." },
      { status: 403 }
    );
  }

  if (!report.aiAnalysisInternal) {
    return NextResponse.json(
      { error: "Este relatório não possui versão interna." },
      { status: 400 }
    );
  }

  try {
    const processed = await processClientMetrics(report.clientId, report.period);
    const periodStr = report.period.toISOString().slice(0, 7);
    const buffer = await compileInternalReportPdf({
      clientName: report.client.name,
      period: periodStr,
      processed,
      aiAnalysisInternal: report.aiAnalysisInternal,
    });

    const monthFormatted = report.period.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    const safeClientName = report.client.name.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-");
    const filename = `relatorio-interno-${safeClientName}-${monthFormatted}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    console.error("[internal-pdf]", err);
    return NextResponse.json(
      { error: "Não foi possível gerar o PDF interno." },
      { status: 500 }
    );
  }
}
