import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { inngest } from "@/lib/inngest/client";
import { runPipelineForClient } from "@/lib/inngest/monthly-report";

export const dynamic = "force-dynamic";

/** Em dev sem Inngest rodando: INNGEST_SYNC_MODE=true roda o pipeline inline para não travar. */
const USE_SYNC_MODE = process.env.INNGEST_SYNC_MODE === "true";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;
  const agencyId = process.env.AGENCY_ID;
  if (!agencyId) {
    return NextResponse.json({ error: "AGENCY_ID não configurado." }, { status: 500 });
  }

  const report = await db.report.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (report.agencyId !== auth.user.agencyId) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  if (USE_SYNC_MODE) {
    try {
      await runPipelineForClient(report.clientId, agencyId, report.period);
      return NextResponse.json({ message: "Relatório gerado.", reportId: id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  await inngest.send({
    name: "metria/generate-report",
    data: { reportId: id, clientId: report.clientId, period: report.period.toISOString() },
  });

  return NextResponse.json({
    message: "Geração do relatório iniciada.",
    reportId: id,
  });
}
