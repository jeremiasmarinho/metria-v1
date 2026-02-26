import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";

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
