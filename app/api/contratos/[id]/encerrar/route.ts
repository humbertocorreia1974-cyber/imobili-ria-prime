import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!['admin', 'corretor'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const motivo = String(body.motivo ?? '').slice(0, 500);

  const contrato = await prisma.contrato.findUnique({ where: { id: params.id } });
  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });

  await prisma.$transaction([
    prisma.contrato.update({
      where: { id: contrato.id },
      data: {
        status: 'encerrado',
        dataFim: contrato.dataFim ?? new Date(),
        observacoes: motivo ? `${contrato.observacoes ?? ''}\n[Encerrado] ${motivo}`.trim() : contrato.observacoes,
      },
    }),
    prisma.imovel.update({
      where: { id: contrato.imovelId },
      data: { situacao: 'disponivel', situacaoAtualizadaEm: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
