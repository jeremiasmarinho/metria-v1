import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const agencyId = process.env.AGENCY_ID;
  if (!agencyId) {
    return NextResponse.json({ error: "AGENCY_ID not configured" }, { status: 500 });
  }
  const reports = await db.report.findMany({
    where: { agencyId },
    include: { client: true },
    orderBy: { period: "desc" },
    take: 100,
  });
  return NextResponse.json(reports);
}

export async function POST(request: Request) {
  const agencyId = process.env.AGENCY_ID;
  if (!agencyId) {
    return NextResponse.json({ error: "AGENCY_ID not configured" }, { status: 500 });
  }
  const body = await request.json();
  const { clientId, period } = body;
  if (!clientId || !period) {
    return NextResponse.json(
      { error: "clientId and period required" },
      { status: 400 }
    );
  }
  const report = await db.report.upsert({
    where: { clientId_period: { clientId, period: new Date(period) } },
    create: {
      clientId,
      agencyId,
      period: new Date(period),
      status: "PENDING",
    },
    update: { status: "PENDING", errorMessage: null },
  });
  return NextResponse.json(report);
}
