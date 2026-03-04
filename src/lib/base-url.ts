import type { NextRequest } from "next/server";

/**
 * Obtém a URL base pública do app.
 * Em VPS atrás de proxy (Easypanel, Caddy, etc.), request.url pode trazer
 * o host interno do container (ex: 2c457a511179:880). Priorizamos
 * NEXTAUTH_URL e headers X-Forwarded-* para obter a URL pública.
 */
export function getBaseUrl(request: NextRequest): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const proto = forwardedProto === "https" ? "https" : "http";
    return `${proto}://${forwardedHost}`.replace(/\/$/, "");
  }
  return new URL(request.url).origin;
}
