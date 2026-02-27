import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutos

export async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: number;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set to refresh Google tokens"
    );
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(
      `Google token refresh failed: ${response.status} ${errBody}`
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function ensureFreshGoogleTokens(
  clientId: string,
  tokens: GoogleTokens
): Promise<GoogleTokens> {
  if (tokens.expiresAt > Date.now() + TOKEN_EXPIRY_BUFFER_MS) {
    return tokens;
  }

  const refreshed = await refreshGoogleToken(tokens.refreshToken);

  const encryptedAccessToken = encrypt(refreshed.accessToken);
  const encryptedRefreshToken = encrypt(tokens.refreshToken);

  const client = await db.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const integrations = (client.integrations ?? {}) as Record<
    string,
    { accessToken?: string; refreshToken?: string; expiresAt?: number }
  >;

  integrations.google = {
    accessToken: encryptedAccessToken,
    refreshToken: encryptedRefreshToken,
    expiresAt: refreshed.expiresAt,
  };

  await db.client.update({
    where: { id: clientId },
    data: { integrations },
  });

  return {
    accessToken: refreshed.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: refreshed.expiresAt,
  };
}

export function assertMetaTokenValid(expiresAt: number): void {
  if (expiresAt < Date.now()) {
    throw new Error("META_TOKEN_EXPIRED");
  }
}
