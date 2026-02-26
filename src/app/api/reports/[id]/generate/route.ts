import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agencyId = process.env.AGENCY_ID;
  if (!agencyId) {
    return NextResponse.json({ error: "AGENCY_ID not configured" }, { status: 500 });
  }

  const report = await db.report.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
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
