import { NextRequest, NextResponse } from "next/server";
import { exchangeMetaCodeForTokens } from "@/lib/oauth/meta";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { OAuthProvider } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const settingsUrl = new URL("/settings", baseUrl);

  if (error) {
    settingsUrl.searchParams.set("oauth_error", `meta:${error}`);
    return NextResponse.redirect(settingsUrl);
  }

  if (!code || !stateRaw) {
    settingsUrl.searchParams.set("oauth_error", "meta:missing_code_or_state");
    return NextResponse.redirect(settingsUrl);
  }

  let state: { agencyId: string; userId: string };
  try {
    state = JSON.parse(
      Buffer.from(stateRaw, "base64url").toString("utf8")
    ) as { agencyId: string; userId: string };
  } catch {
    settingsUrl.searchParams.set("oauth_error", "meta:invalid_state");
    return NextResponse.redirect(settingsUrl);
  }

  const redirectUri = `${baseUrl}/api/oauth/meta/callback`;

  try {
    const { accessToken, expiresIn } = await exchangeMetaCodeForTokens(
      code,
      redirectUri
    );

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    const encryptedToken = encrypt(accessToken);

    await db.agencyConnection.upsert({
      where: {
        agencyId_provider: {
          agencyId: state.agencyId,
          provider: OAuthProvider.META,
        },
      },
      create: {
        agencyId: state.agencyId,
        provider: OAuthProvider.META,
        accessToken: encryptedToken,
        connectedBy: state.userId,
        expiresAt,
        status: "CONNECTED",
      },
      update: {
        accessToken: encryptedToken,
        refreshToken: null,
        expiresAt,
        connectedBy: state.userId,
        status: "CONNECTED",
      },
    });

    settingsUrl.searchParams.set("oauth_success", "meta");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    settingsUrl.searchParams.set("oauth_error", `meta:${encodeURIComponent(msg)}`);
  }

  return NextResponse.redirect(settingsUrl);
}
