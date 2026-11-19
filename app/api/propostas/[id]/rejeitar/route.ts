import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const role = session.user.role;
  if (!['admin', 'proprietario'].includes(role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const motivo = String(body?.motivo ?? 'Sem motivo informado');

  const proposta = await prisma.proposta.findUnique({ where: { id: params.id } });
  if (!proposta) return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });

  if (role === 'proprietario') {
    const prop = await prisma.proprietario.findUnique({ where: { userId: session.user.id } });
    if (!prop || proposta.proprietarioId !== prop.id) {
      return NextResponse.json({ error: 'Proposta não pertence a você' }, { status: 403 });
    }
  }

  const atualizada = await prisma.proposta.update({
    where: { id: params.id },
    data: { status: 'rejeitada', motivoRejeicao: motivo },
  });

  return NextResponse.json({ ok: true, proposta: atualizada });
}
