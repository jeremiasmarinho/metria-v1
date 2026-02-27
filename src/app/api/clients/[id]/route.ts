import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().optional(),
  active: z.boolean().optional(),
  integrations: z
    .object({
      google: z
        .object({
          accessToken: z.string(),
          refreshToken: z.string(),
          expiresAt: z.number(),
        })
        .optional(),
      meta: z
        .object({
          accessToken: z.string(),
          expiresAt: z.number(),
        })
        .optional(),
    })
    .optional(),
  reportConfig: z
    .object({
      googlePropertyId: z.string().optional(),
      googleSiteUrl: z.string().optional(),
      metaAdAccountId: z.string().optional(),
      logo: z.string().optional(),
      primaryColor: z.string().optional(),
    })
    .optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.slug !== undefined) data.slug = parsed.data.slug;
  if (parsed.data.email !== undefined) data.email = parsed.data.email || null;
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.reportConfig !== undefined)
    data.reportConfig = parsed.data.reportConfig;

  if (parsed.data.integrations) {
    const existing = await db.client.findUnique({
      where: { id },
      select: { integrations: true },
    });
    const existingInt = (existing?.integrations ?? {}) as Record<string, unknown>;
    const encrypted: Record<string, unknown> = { ...existingInt };
    if (parsed.data.integrations.google) {
      const g = parsed.data.integrations.google;
      encrypted.google = {
        accessToken: encrypt(g.accessToken),
        refreshToken: encrypt(g.refreshToken),
        expiresAt: g.expiresAt,
      };
    }
    if (parsed.data.integrations.meta) {
      const m = parsed.data.integrations.meta;
      encrypted.meta = {
        accessToken: encrypt(m.accessToken),
        expiresAt: m.expiresAt,
      };
    }
    data.integrations = encrypted;
  }

  const client = await db.client.update({ where: { id }, data });
  return NextResponse.json(client);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = await db.client.findUnique({ where: { id } });
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  return NextResponse.json(client);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await db.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível excluir este cliente. Verifique se existem dados vinculados e tente novamente.",
      },
      { status: 400 }
    );
  }
}
