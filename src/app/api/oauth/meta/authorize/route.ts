import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMetaAuthorizeUrl } from "@/lib/oauth/meta";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; agencyId?: string } | undefined;
  if (!user?.id || !user?.agencyId) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/oauth/meta/callback`;
  const state = Buffer.from(
    JSON.stringify({ agencyId: user.agencyId, userId: user.id })
  ).toString("base64url");

  const url = getMetaAuthorizeUrl(redirectUri, state);
  return NextResponse.redirect(url);
}
