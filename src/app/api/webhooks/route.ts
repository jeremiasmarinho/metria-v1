import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const securityToken = process.env.ZAPI_SECURITY_TOKEN;
  if (!securityToken) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const providedToken = request.headers.get("x-security-token");
  if (providedToken !== securityToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await request.json().catch(() => ({}));
  return NextResponse.json({ received: true });
}
