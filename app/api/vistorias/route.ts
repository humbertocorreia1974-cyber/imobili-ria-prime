import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo');
  const status = searchParams.get('status');
  const where: any = {};
  if (tipo) where.tipo = tipo;
  if (status) where.status = status;

  const vistorias = await prisma.vistoria.findMany({
    where,
    orderBy: { dataVistoria: 'desc' },
    take: 100,
    include: { imovel: { select: { codigo: true, titulo: true } }, _count: { select: { itens: true } } },
  });
  return NextResponse.json(vistorias);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!['admin', 'corretor'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const imovelId = String(body.imovelId ?? '');
  const tipo = body.tipo === 'saida' ? 'saida' : 'entrada';
  if (!imovelId) return NextResponse.json({ error: 'imovelId obrigatório' }, { status: 400 });

  const imovel = await prisma.imovel.findUnique({ where: { id: imovelId } });
  if (!imovel) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });

  const vistoria = await prisma.vistoria.create({
    data: {
      imovelId,
      tipo,
      status: 'em_andamento',
      responsavelId: session.user.id,
    },
  });

  return NextResponse.json({ id: vistoria.id });
}
