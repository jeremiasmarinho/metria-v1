import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Indica se as credenciais OAuth para conectar as contas pai estão configuradas. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const googleReady = !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  );
  const metaReady = !!(
    process.env.META_APP_ID &&
    process.env.META_APP_SECRET
  );

  return NextResponse.json({ google: googleReady, meta: metaReady });
}
