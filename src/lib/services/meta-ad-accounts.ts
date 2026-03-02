/**
 * Meta Marketing API - lista contas de anúncios da agência.
 * Usa o token da AgencyConnection (conexão "Mãe" / Business Manager).
 * Implementa paginação via cursor (paging.next) para agências com muitas contas.
 * @see https://developers.facebook.com/docs/graph-api/using-graph-api/pagination
 */

const META_GRAPH_VERSION = "v21.0";
const PAGE_LIMIT = 50;

export interface MetaAdAccount {
  id: string; // act_xxxxx
  name: string;
  accountStatus: number;
}

export async function listMetaAdAccounts(
  accessToken: string
): Promise<MetaAdAccount[]> {
  const allAccounts: MetaAdAccount[] = [];
  let url: string | null = buildInitialUrl(accessToken);

  while (url) {
    const res = await fetch(url);

    if (!res.ok) {
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
}

function buildInitialUrl(accessToken: string): string {
  const params = new URLSearchParams({
    fields: "id,name,account_status",
    access_token: accessToken,
    limit: String(PAGE_LIMIT),
  });
  return `https://graph.facebook.com/${META_GRAPH_VERSION}/me/adaccounts?${params}`;
}
