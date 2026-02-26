const ZAPI_BASE = "https://api.z-api.io";

interface ZApiHealthResponse {
  connected?: boolean;
  session?: string;
}

export async function checkZApiHealth(): Promise<boolean> {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  if (!instanceId || !token) return false;

  const response = await fetch(`${ZAPI_BASE}/instances/${instanceId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return false;
  const data = (await response.json()) as ZApiHealthResponse;
  return !!data.connected;
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  pdfUrl?: string
): Promise<void> {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  if (!instanceId || !token) {
    throw new Error("Z-API not configured (ZAPI_INSTANCE_ID, ZAPI_TOKEN)");
  }

  const phoneNormalized = phone.replace(/\D/g, "");
  const payload: Record<string, unknown> = {
    phone: phoneNormalized,
    message,
  };

  if (pdfUrl) {
    payload.document = pdfUrl;
  }

  const response = await fetch(
    `${ZAPI_BASE}/instances/${instanceId}/send-text`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(`Z-API error: ${response.status} ${await response.text()}`);
  }
}
