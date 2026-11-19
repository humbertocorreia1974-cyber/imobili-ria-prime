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
  const indice = String(body.indice ?? 'IGP-M');
  const percentual = Number(body.percentual);
  if (!Number.isFinite(percentual) || percentual <= 0 || percentual > 100) {
    return NextResponse.json({ error: 'Percentual inválido' }, { status: 400 });
  }

  const contrato = await prisma.contrato.findUnique({ where: { id: params.id } });
  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
  if (contrato.tipo !== 'locacao') return NextResponse.json({ error: 'Reajuste apenas para locação' }, { status: 400 });

  const valorAnterior = Number(contrato.valorMensal ?? 0);
  const valorNovo = Number((valorAnterior * (1 + percentual / 100)).toFixed(2));
  const competencia = new Date().toISOString().slice(0, 7);
  const proximo = new Date();
  proximo.setFullYear(proximo.getFullYear() + 1);

  const [atualizado] = await prisma.$transaction([
    prisma.contrato.update({
      where: { id: contrato.id },
      data: {
        valorMensal: valorNovo,
        percentualReajuste: percentual,
        proximoReajusteEm: proximo,
      },
    }),
    prisma.historicoReajuste.create({
      data: {
        contratoId: contrato.id,
        aplicadoPorId: session.user.id,
        indice,
        percentual,
        valorAnterior,
        valorNovo,
        competencia,
        observacoes: `Reajuste aplicado via painel (${indice})`,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    valorAnterior: valorAnterior.toFixed(2),
    valorNovo: valorNovo.toFixed(2),
    proximoReajusteEm: atualizado.proximoReajusteEm,
  });
}
