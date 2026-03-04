/**
 * Google Ads API - lista contas acessíveis (MCC / managed accounts).
 * O Developer Token é obrigatório para qualquer chamada à API.
 * @see https://developers.google.com/google-ads/api/docs/first-call/overview#developer_token
 */

const API_VERSION = "v20";
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

export interface GoogleAdsAccount {
  id: string; // resource name: customers/1234567890
  customerId: string; // 1234567890 ou 123-456-7890
  descriptiveName?: string;
}

export async function listGoogleAdsAccounts(
  accessToken: string
): Promise<GoogleAdsAccount[]> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken || developerToken.trim() === "") {
    throw new Error(
      "GOOGLE_ADS_DEVELOPER_TOKEN é obrigatório para a API do Google Ads. " +
        "Obtenha em https://developers.google.com/google-ads/api/docs/first-call/overview"
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "developer-token": developerToken,
  };

  const res = await fetch(
    `${BASE_URL}/customers:listAccessibleCustomers`,
    { headers }
  );

  if (!res.ok) {
    if (res.status === 401) throw new Error("GOOGLE_TOKEN_INVALID");
    if (res.status === 403) throw new Error("GOOGLE_PERMISSION_DENIED");
    const text = await res.text();
    throw new Error(`Google Ads API error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { resourceNames?: string[] };

  const resourceNames = data.resourceNames ?? [];
  return resourceNames
    .filter((r) => r.startsWith("customers/"))
    .map((r) => {
      const customerId = r.replace("customers/", "");
      return {
        id: r,
        customerId: formatCustomerId(customerId),
        descriptiveName: undefined,
      };
    });
}

function formatCustomerId(id: string): string {
  if (id.length === 10 && /^\d+$/.test(id)) {
    return `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}`;
  }
  return id;
}
