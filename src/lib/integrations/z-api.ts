const ZAPI_BASE = "https://api.z-api.io";

interface ZApiHealthResponse {
  connected?: boolean;
  session?: string;
  error?: string;
  message?: string;
}

interface ZApiSendResponse {
  id?: string;
  messageId?: string;
  error?: string;
  message?: string;
}

export async function checkZApiHealth(): Promise<boolean> {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const securityToken = process.env.ZAPI_SECURITY_TOKEN;
  if (!instanceId || !token) return false;

  const response = await fetch(
    `${ZAPI_BASE}/instances/${instanceId}/token/${token}/status`,
    {
      headers: {
        ...(securityToken ? { "Client-Token": securityToken } : {}),
      },
    }
  );

  if (!response.ok) return false;
  const data = (await response.json()) as ZApiHealthResponse;
  if (data.error) return false;
  return Boolean(data.connected);
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  pdfUrl?: string
): Promise<void> {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const securityToken = process.env.ZAPI_SECURITY_TOKEN;
  if (!instanceId || !token) {
    throw new Error("Z-API not configured (ZAPI_INSTANCE_ID, ZAPI_TOKEN)");
  }

  const phoneNormalized = phone.replace(/\D/g, "");
  const isDocumentMessage = Boolean(pdfUrl);
  const endpoint = isDocumentMessage ? "send-document/pdf" : "send-text";
  const payload: Record<string, unknown> = isDocumentMessage
    ? {
        phone: phoneNormalized,
        document: pdfUrl,
        fileName: "Relatorio_Metria.pdf",
        caption: message,
      }
    : {
        phone: phoneNormalized,
        message,
      };

  const response = await fetch(
    `${ZAPI_BASE}/instances/${instanceId}/token/${token}/${endpoint}`,
    {
      method: "POST",
      headers: {
        ...(securityToken ? { "Client-Token": securityToken } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(`Z-API error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as ZApiSendResponse;
  if (data.error) {
    throw new Error(`Z-API error: ${data.error} ${data.message ?? ""}`.trim());
  }
}
