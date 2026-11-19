import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const proprietario = await prisma.proprietario.findUnique({
    where: { userId: session.user.id },
    include: {
      imoveis: { select: { id: true, codigo: true, titulo: true, situacao: true, valorAluguel: true, valorVenda: true } },
      repasses: { orderBy: { competencia: 'desc' }, take: 24 },
      manutencoesAprovadas: {
        where: { status: { in: ['aguardando_aprovacao', 'orcamento'] } },
        orderBy: { createdAt: 'desc' },
        include: { imovel: { select: { codigo: true, titulo: true } } },
      },
    },
  });

  if (!proprietario) return NextResponse.json({ error: 'proprietario_not_found' }, { status: 404 });

  const contratos = await prisma.contrato.findMany({
    where: { imovel: { proprietarioId: proprietario.id }, status: 'ativo' },
    include: { imovel: { select: { codigo: true, titulo: true } } },
    orderBy: { dataInicio: 'desc' },
  });

  const totalRepassado = proprietario.repasses
    .filter((r) => r.status === 'pago')
    .reduce((acc, r) => acc + Number(r.valorLiquido), 0);
  const totalPendente = proprietario.repasses
    .filter((r) => r.status !== 'pago')
    .reduce((acc, r) => acc + Number(r.valorLiquido), 0);

  return NextResponse.json({
    proprietario: {
      id: proprietario.id,
      nome: proprietario.nome,
      cpfCnpj: proprietario.cpfCnpj,
      pixChave: proprietario.pixChave,
      banco: proprietario.banco,
      agencia: proprietario.agencia,
      conta: proprietario.conta,
    },
    imoveis: proprietario.imoveis,
    repasses: proprietario.repasses,
    manutencoesPendentes: proprietario.manutencoesAprovadas,
    contratos,
    kpis: { totalRepassado, totalPendente, imoveisAtivos: proprietario.imoveis.length },
  });
}
