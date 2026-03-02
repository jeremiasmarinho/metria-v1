import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { inngest } from "@/lib/inngest/client";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;

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

  await inngest.send({
    name: "metria/generate-report",
    data: { reportId: id, clientId: report.clientId, period: report.period.toISOString() },
  });

  return NextResponse.json({
    message: "Report generation triggered",
    reportId: id,
  });
}
