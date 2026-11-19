import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const manutencao = await prisma.manutencao.findUnique({
    where: { id: params.id },
    include: { proprietario: true },
  });
  if (!manutencao) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });

  const role = session.user.role;
  const isAdmin = role === 'admin' || role === 'corretor';
  const isDono = role === 'proprietario' && manutencao.proprietario?.userId === session.user.id;
  if (!isAdmin && !isDono) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const { valorOrcamento, prestadorNome, prestadorContato } = await request.json();
  if (!valorOrcamento || !prestadorNome) {
    return NextResponse.json({ error: 'valorOrcamento e prestadorNome são obrigatórios' }, { status: 400 });
  }

  const updated = await prisma.manutencao.update({
    where: { id: params.id },
    data: {
      valorOrcamento,
      prestadorNome,
      prestadorContato: prestadorContato ?? null,
      status: 'aguardando_aprovacao',
    },
  });
  return NextResponse.json(updated);
}
