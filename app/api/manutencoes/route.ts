import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const where: any = {};
  if (session.user.role === 'inquilino') where.solicitanteId = session.user.id;
  if (session.user.role === 'proprietario') {
    const prop = await prisma.proprietario.findUnique({ where: { userId: session.user.id } });
    where.proprietarioId = prop?.id ?? '__none__';
  }

  const manutencoes = await prisma.manutencao.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { imovel: { select: { id: true, codigo: true, titulo: true } } },
  });
  return NextResponse.json(manutencoes);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = await request.json();
  const { imovelId, titulo, descricao, categoria, urgencia } = body ?? {};
  if (!imovelId || !titulo || !descricao) {
    return NextResponse.json({ error: 'imovelId, titulo e descricao são obrigatórios' }, { status: 400 });
  }

  const imovel = await prisma.imovel.findUnique({ where: { id: imovelId } });
  if (!imovel) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });

  // Inquilino só pode abrir manutenção em imóvel com contrato ativo dele.
  if (session.user.role === 'inquilino') {
    const contrato = await prisma.contrato.findFirst({
      where: { imovelId, userIdInquilino: session.user.id, status: 'ativo' },
    });
    if (!contrato) return NextResponse.json({ error: 'Sem contrato ativo neste imóvel' }, { status: 403 });
  }

  const manutencao = await prisma.manutencao.create({
    data: {
      imobiliariaId: imovel.imobiliariaId,
      imovelId,
      proprietarioId: imovel.proprietarioId,
      solicitanteId: session.user.id,
      titulo,
      descricao,
      categoria: categoria ?? 'outros',
      urgencia: urgencia ?? 'normal',
      status: 'aberta',
    },
  });

  return NextResponse.json(manutencao, { status: 201 });
}
