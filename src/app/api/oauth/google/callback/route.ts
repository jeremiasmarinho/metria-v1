import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCodeForTokens } from "@/lib/oauth/google";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { OAuthProvider } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = requestUrl.origin;
  const settingsUrl = new URL("/settings", baseUrl);

  if (error) {
    settingsUrl.searchParams.set("oauth_error", `google:${error}`);
    return NextResponse.redirect(settingsUrl);
  }

  if (!code || !stateRaw) {
    settingsUrl.searchParams.set("oauth_error", "google:missing_code_or_state");
    return NextResponse.redirect(settingsUrl);
  }

  let state: { agencyId: string; userId: string };
  try {
    state = JSON.parse(
      Buffer.from(stateRaw, "base64url").toString("utf8")
    ) as { agencyId: string; userId: string };
  } catch {
    settingsUrl.searchParams.set("oauth_error", "google:invalid_state");
    return NextResponse.redirect(settingsUrl);
  }

  const redirectUri = `${baseUrl}/api/oauth/google/callback`;

  try {
    const { accessToken, refreshToken, expiresIn } =
      await exchangeGoogleCodeForTokens(code, redirectUri);

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    const encryptedAccess = encrypt(accessToken);
    const encryptedRefresh = refreshToken ? encrypt(refreshToken) : null;

    await db.agencyConnection.upsert({
      where: {
        agencyId_provider: {
          agencyId: state.agencyId,
          provider: OAuthProvider.GOOGLE,
        },
      },
      create: {
        agencyId: state.agencyId,
        provider: OAuthProvider.GOOGLE,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        connectedBy: state.userId,
        expiresAt,
        status: "CONNECTED",
      },
      update: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        expiresAt,
        connectedBy: state.userId,
        status: "CONNECTED",
      },
    });

    settingsUrl.searchParams.set("oauth_success", "google");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    settingsUrl.searchParams.set("oauth_error", `google:${encodeURIComponent(msg)}`);
  }

  return NextResponse.redirect(settingsUrl);
}
