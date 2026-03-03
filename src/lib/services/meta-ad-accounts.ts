/**
 * Meta Marketing API - lista contas de anúncios da agência.
 * Usa o token da AgencyConnection (conexão "Mãe" / Business Manager) ou
 * META_ADS_ACCESS_TOKEN do .env em desenvolvimento.
 * Bypass Sandbox: em dev, retorna Cliente Cobaia ao falhar (erro de faturamento).
 * @see https://developers.facebook.com/docs/graph-api/using-graph-api/pagination
 */

const META_GRAPH_VERSION = "v25.0";
const PAGE_LIMIT = 50;

export interface MetaAdAccount {
  id: string; // act_xxxxx
  name: string;
  accountStatus: number;
}

/** Mock para bypass em Sandbox/desenvolvimento */
const SANDBOX_MOCK_ACCOUNT: MetaAdAccount = {
  id: "act_123456789",
  name: "Cliente Cobaia Meta (Sandbox)",
  accountStatus: 1,
};

function isSandboxBypassEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

export async function listMetaAdAccounts(
  accessToken: string
): Promise<MetaAdAccount[]> {
  const token =
    accessToken ||
    (process.env.NODE_ENV !== "production" ? process.env.META_ADS_ACCESS_TOKEN : undefined);
  if (!token) {
    throw new Error("Token de acesso Meta não disponível.");
  }

  const allAccounts: MetaAdAccount[] = [];
  let url: string | null = buildInitialUrl(token);

  try {
    while (url) {
      const res = await fetch(url);

      if (!res.ok) {
        if (isSandboxBypassEnabled()) {
          return [SANDBOX_MOCK_ACCOUNT];
        }
        if (res.status === 401) throw new Error("META_TOKEN_INVALID");
        if (res.status === 403) throw new Error("META_PERMISSION_DENIED");
        const text = await res.text();
        throw new Error(`Meta API error: ${res.status} ${text}`);
      }

      const json = (await res.json()) as {
        data?: Array<{
        id?: string;
        name?: string;
        account_status?: number;
      }>;
      paging?: { next?: string };
    };

    const page = json.data ?? [];
    for (const a of page) {
      if (a.id) {
        allAccounts.push({
          id: a.id,
          name: a.name ?? a.id,
          accountStatus: a.account_status ?? 0,
        });
      }
    }

      url = json.paging?.next ?? null;
    }
    return allAccounts;
  } catch (err) {
    if (isSandboxBypassEnabled()) {
      return [SANDBOX_MOCK_ACCOUNT];
    }
    throw err;
  }
}

function buildInitialUrl(accessToken: string): string {
  const params = new URLSearchParams({
    fields: "id,name,account_status",
    access_token: accessToken,
    limit: String(PAGE_LIMIT),
  });
  return `https://graph.facebook.com/${META_GRAPH_VERSION}/me/adaccounts?${params}`;
}
