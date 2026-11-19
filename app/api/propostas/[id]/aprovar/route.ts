import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const role = session.user.role;
  if (!['admin', 'proprietario'].includes(role)) {
    return NextResponse.json({ error: 'Sem permissão para aprovar' }, { status: 403 });
  }

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
    data: { status: 'aprovada', aprovadaEm: new Date(), aprovadorId: session.user.id },
  });

  await prisma.logAuditoria.create({
    data: { userId: session.user.id, acao: 'aprovar_proposta', entidade: 'Proposta', entidadeId: params.id },
  });

  return NextResponse.json({ ok: true, proposta: atualizada });
}
