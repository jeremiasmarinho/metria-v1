import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGoogleAuthorizeUrl } from "@/lib/oauth/google";

export const dynamic = "force-dynamic";

function getBaseUrl(request: NextRequest): string {
  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; agencyId?: string } | undefined;
  if (!user?.id || !user?.agencyId) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  try {
    const redirectUri = `${baseUrl}/api/oauth/google/callback`;
    const state = Buffer.from(
      JSON.stringify({ agencyId: user.agencyId, userId: user.id })
    ).toString("base64url");

    const url = getGoogleAuthorizeUrl(redirectUri, state);
    return NextResponse.redirect(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Configuração necessária";
    return NextResponse.redirect(new URL(`/settings?oauth_error=google:${encodeURIComponent(msg)}`, baseUrl));
  }
}
