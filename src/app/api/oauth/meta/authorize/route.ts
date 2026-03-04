import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBaseUrl } from "@/lib/base-url";
import { getMetaAuthorizeUrl } from "@/lib/oauth/meta";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; agencyId?: string } | undefined;
  if (!user?.id || !user?.agencyId) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  try {
    const redirectUri = `${baseUrl}/api/oauth/meta/callback`;
    const state = Buffer.from(
      JSON.stringify({ agencyId: user.agencyId, userId: user.id })
    ).toString("base64url");

    const url = getMetaAuthorizeUrl(redirectUri, state);
    return NextResponse.redirect(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Configuração necessária";
    return NextResponse.redirect(new URL(`/settings?oauth_error=meta:${encodeURIComponent(msg)}`, baseUrl));
  }
}
