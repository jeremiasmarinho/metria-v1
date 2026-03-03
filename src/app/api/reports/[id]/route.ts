import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  }

  const report = await db.report.findUnique({
    where: { id },
    select: { id: true, status: true, errorMessage: true, sentAt: true, agencyId: true },
  });

  if (!report) {
    return NextResponse.json({ error: "Relatório não encontrado." }, { status: 404 });
  }

  if (report.agencyId !== auth.user.agencyId) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  return NextResponse.json(report);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "ID do relatório é obrigatório." },
      { status: 400 }
    );
  }

  try {
    const report = await db.report.findUnique({
      where: { id },
      select: { id: true, agencyId: true, clientId: true },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Relatório não encontrado." },
        { status: 404 }
      );
    }

    if (report.agencyId !== auth.user.agencyId) {
      return NextResponse.json(
        { error: "Sem permissão para excluir este relatório." },
        { status: 403 }
      );
    }

    const { clientId } = report;
    await db.report.delete({ where: { id } });

    revalidatePath("/reports");
    revalidatePath("/dashboard");
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível excluir este relatório. Tente novamente em instantes.",
      },
      { status: 400 }
    );
  }
}
