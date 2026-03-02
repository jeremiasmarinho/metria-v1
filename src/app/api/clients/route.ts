import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const clients = await db.client.findMany({
    where: { agencyId: auth.user.agencyId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slug = parsed.data.slug ?? slugify(parsed.data.name);

  try {
    const client = await db.client.create({
      data: {
        agencyId: auth.user.agencyId,
        name: parsed.data.name,
        slug,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        active: parsed.data.active ?? true,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { error: "Já existe um cliente com esse slug nesta agência." },
        { status: 409 }
      );
    }
    throw err;
  }
}
