const META_GRAPH_VERSION = "v25.0";

export function getMetaAuthorizeUrl(redirectUri: string, state: string): string {
  const clientId = process.env.META_APP_ID ?? process.env.FACEBOOK_CLIENT_ID;
  if (!clientId) throw new Error("META_APP_ID ou FACEBOOK_CLIENT_ID deve estar configurado");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "ads_management,business_management,ads_read",
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?${params}`;
}

export async function exchangeMetaCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; expiresIn?: number }> {
  const clientId = process.env.META_APP_ID ?? process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.META_APP_SECRET ?? process.env.FACEBOOK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("META_APP_ID/META_APP_SECRET ou FACEBOOK_CLIENT_ID/FACEBOOK_CLIENT_SECRET devem estar configurados");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token?${params}`,
    { method: "GET" }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta token exchange failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
  };

  if (!data.access_token) throw new Error("Meta did not return access_token");

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}
