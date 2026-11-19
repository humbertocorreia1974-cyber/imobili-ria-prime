import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!["corretor","proprietario","inquilino","admin","master","owner","superadmin"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const manutencaoId = body?.manutencaoId as string | undefined;
  const acao = body?.acao as 'aprovar' | 'rejeitar' | undefined;
  const motivo = (body?.motivo as string | undefined) ?? null;

  if (!manutencaoId || !acao) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const proprietario = await prisma.proprietario.findUnique({ where: { userId: session.user.id } });
  if (!proprietario) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const manutencao = await prisma.manutencao.findFirst({
    where: { id: manutencaoId, proprietarioId: proprietario.id },
    include: { imovel: { select: { codigo: true, titulo: true } } },
  });
  if (!manutencao) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const updated = await prisma.manutencao.update({
    where: { id: manutencao.id },
    data:
      acao === 'aprovar'
        ? { status: 'aprovada', aprovadaEm: new Date(), aprovadorId: session.user.id, valorAprovado: manutencao.valorOrcamento }
        : { status: 'rejeitada', motivoRejeicao: motivo ?? 'Sem justificativa', aprovadorId: session.user.id },
  });

  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      acao: acao === 'aprovar' ? 'manutencao.aprovar' : 'manutencao.rejeitar',
      entidade: 'Manutencao',
      entidadeId: manutencao.id,
      dadosNovos: { status: updated.status },
    },
  });

  if (manutencao.solicitanteId) {
    const solicitante = await prisma.user.findUnique({ where: { id: manutencao.solicitanteId } });
    if (solicitante?.email) {
      await sendEmail({
        to: solicitante.email,
        subject: `Manutenção ${acao === 'aprovar' ? 'aprovada' : 'rejeitada'} — ${manutencao.imovel.codigo}`,
        html: `<p>Olá ${solicitante.name},</p><p>A manutenção <strong>${manutencao.titulo}</strong> do imóvel ${manutencao.imovel.codigo} foi <strong>${acao === 'aprovar' ? 'aprovada' : 'rejeitada'}</strong> pelo proprietário.</p>${motivo ? `<p>Motivo: ${motivo}</p>` : ''}`,
      }).catch(() => null);
    }
  }

  return NextResponse.json({ ok: true, manutencao: updated });
}
