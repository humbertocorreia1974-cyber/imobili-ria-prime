import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!["corretor","proprietario","inquilino","admin","master","owner","superadmin"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.imovelId || !body?.clienteId || !body?.valor) {
    return NextResponse.json({ error: 'imovelId, clienteId e valor são obrigatórios' }, { status: 400 });
  }

  const imovel = await prisma.imovel.findUnique({ where: { id: body.imovelId } });
  if (!imovel) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });

  const proposta = await prisma.proposta.create({
    data: {
      imovelId: body.imovelId,
      clienteId: body.clienteId,
      corretorId: imovel.corretorId ?? null,
      proprietarioId: imovel.proprietarioId,
      criadoPorId: session.user.id,
      tipo: body.tipo === 'compra' ? 'compra' : 'locacao',
      valor: body.valor,
      condicoes: body.condicoes ?? null,
      status: 'em_analise',
    },
  });

  await prisma.logAuditoria.create({
    data: { userId: session.user.id, acao: 'criar', entidade: 'Proposta', entidadeId: proposta.id },
  }).catch(() => {});

  return NextResponse.json({ ok: true, proposta });
}
