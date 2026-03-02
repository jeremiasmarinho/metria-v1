import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; agencyId?: string } | undefined;
  if (!user?.agencyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await db.agencyConnection.findMany({
    where: { agencyId: user.agencyId },
    select: {
      id: true,
      provider: true,
      status: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    connections.map((c) => ({
      id: c.id,
      provider: c.provider,
      status: c.status,
      expiresAt: c.expiresAt?.toISOString() ?? null,
      connectedAt: c.createdAt.toISOString(),
    }))
  );
}
