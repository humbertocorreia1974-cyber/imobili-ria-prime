import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const manutencao = await prisma.manutencao.findUnique({
    where: { id: params.id },
    include: { proprietario: true },
  });
  if (!manutencao) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });

  const role = session.user.role;
  const isAdmin = role === 'admin';
  const isDono = role === 'proprietario' && manutencao.proprietario?.userId === session.user.id;
  if (!isAdmin && !isDono) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const updated = await prisma.manutencao.update({
    where: { id: params.id },
    data: {
      status: 'aprovada',
      aprovadorId: session.user.id,
      valorAprovado: manutencao.valorOrcamento,
      aprovadaEm: new Date(),
    },
  });
  return NextResponse.json(updated);
}
