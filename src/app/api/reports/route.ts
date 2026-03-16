import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createReportSchema = z.object({
  clientId: z.string().min(1),
  period: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "period must be a valid date string",
  }),
  customPrompt: z
    .string()
    .trim()
    .max(1000)
    .optional(),
  googleAdsFocus: z.array(z.string().min(1)).optional(),
  metaAdsFocus: z.array(z.string().min(1)).optional(),
});

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const reports = await db.report.findMany({
    where: { agencyId: auth.user.agencyId },
    include: { client: true },
    orderBy: { period: "desc" },
    take: 100,
  });
  return NextResponse.json(reports);
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

  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify client belongs to user's agency
  const client = await db.client.findUnique({
    where: { id: parsed.data.clientId },
    select: { agencyId: true },
  });

  if (!client || client.agencyId !== auth.user.agencyId) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  const report = await db.report.upsert({
    where: {
      clientId_period: {
        clientId: parsed.data.clientId,
        period: new Date(parsed.data.period),
      },
    },
    create: {
      clientId: parsed.data.clientId,
      agencyId: auth.user.agencyId,
      period: new Date(parsed.data.period),
      status: "PENDING",
      customPrompt: parsed.data.customPrompt?.length ? parsed.data.customPrompt : null,
      googleAdsFocus: parsed.data.googleAdsFocus ?? [],
      metaAdsFocus: parsed.data.metaAdsFocus ?? [],
    },
    update: {
      status: "PENDING",
      errorMessage: null,
      customPrompt: parsed.data.customPrompt?.length ? parsed.data.customPrompt : null,
      googleAdsFocus: parsed.data.googleAdsFocus ?? [],
      metaAdsFocus: parsed.data.metaAdsFocus ?? [],
    },
  });
  return NextResponse.json(report, { status: 201 });
}
