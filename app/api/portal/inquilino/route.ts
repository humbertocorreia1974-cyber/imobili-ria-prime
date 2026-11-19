import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const contratos = await prisma.contrato.findMany({
    where: { userIdInquilino: session.user.id, status: { in: ['ativo', 'inadimplente'] } },
    include: {
      imovel: { select: { codigo: true, titulo: true, bairro: true, cidade: true } },
      parcelas: {
        orderBy: { dataVencimento: 'desc' },
        take: 12,
        include: { boletos: { orderBy: { createdAt: 'desc' }, take: 1 } },
      },
    },
  });

  const manutencoes = await prisma.manutencao.findMany({
    where: { solicitanteId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { imovel: { select: { codigo: true, titulo: true } } },
  });

  return NextResponse.json({ contratos, manutencoes });
}
