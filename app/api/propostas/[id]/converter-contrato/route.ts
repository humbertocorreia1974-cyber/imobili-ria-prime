import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admin pode gerar contrato' }, { status: 403 });
  }

  const proposta = await prisma.proposta.findUnique({
    where: { id: params.id },
    include: { imovel: true },
  });
  if (!proposta) return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
  if (proposta.status !== 'aprovada') {
    return NextResponse.json({ error: 'Proposta precisa estar aprovada' }, { status: 400 });
  }

  const numero = `CT-${Date.now().toString().slice(-8)}`;
  const contrato = await prisma.contrato.create({
    data: {
      imobiliariaId: proposta.imovel.imobiliariaId,
      imovelId: proposta.imovelId,
      propostaId: proposta.id,
      corretorId: proposta.corretorId,
      inquilinoId: proposta.tipo === 'locacao' ? proposta.clienteId : null,
      compradorId: proposta.tipo === 'compra' ? proposta.clienteId : null,
      numero,
      tipo: proposta.tipo,
      status: 'ativo',
      valorMensal: proposta.tipo === 'locacao' ? proposta.valor : null,
      valorTotal: proposta.tipo === 'compra' ? proposta.valor : null,
      garantiaTipo: proposta.garantiaTipo,
      dataInicio: proposta.dataInicio ?? new Date(),
      dataFim: proposta.prazoMeses
        ? new Date(new Date(proposta.dataInicio ?? new Date()).setMonth(new Date(proposta.dataInicio ?? new Date()).getMonth() + proposta.prazoMeses))
        : null,
    },
  });

  await prisma.proposta.update({ where: { id: params.id }, data: { status: 'convertida' } });

  return NextResponse.json({ ok: true, contrato });
}
