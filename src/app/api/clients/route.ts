import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
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
  const agencyId = process.env.AGENCY_ID;
  if (!agencyId) {
    return NextResponse.json({ error: "AGENCY_ID not configured" }, { status: 500 });
  }
  const clients = await db.client.findMany({
    where: { agencyId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const agencyId = process.env.AGENCY_ID;
  if (!agencyId) {
    return NextResponse.json({ error: "AGENCY_ID not configured" }, { status: 500 });
  }

  const body = await request.json();
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slug = parsed.data.slug ?? slugify(parsed.data.name);

  const client = await db.client.create({
    data: {
      agencyId,
      name: parsed.data.name,
      slug,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      active: parsed.data.active ?? true,
    },
  });

  return NextResponse.json(client);
}
