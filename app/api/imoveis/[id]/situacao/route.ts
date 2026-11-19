import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const VALIDAS = ['disponivel', 'reservado', 'locado', 'vendido'];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!['admin', 'corretor'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const situacao = body?.situacao;
  if (!situacao || !VALIDAS.includes(situacao)) {
    return NextResponse.json({ error: 'Situação inválida' }, { status: 400 });
  }

  const imovel = await prisma.imovel.findUnique({ where: { id: params.id } });
  if (!imovel) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });

  const atualizado = await prisma.imovel.update({
    where: { id: params.id },
    data: { situacao, situacaoAtualizadaEm: new Date() },
  });

  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      acao: 'atualizar_situacao_imovel',
      entidade: 'Imovel',
      entidadeId: imovel.id,
      dadosAnteriores: { situacao: imovel.situacao },
      dadosNovos: { situacao },
    },
  });

  return NextResponse.json({ ok: true, imovel: atualizado });
}
