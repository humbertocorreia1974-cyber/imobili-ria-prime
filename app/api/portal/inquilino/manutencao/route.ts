import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!["corretor","proprietario","inquilino","admin","master","owner","superadmin"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const contratoId = body?.contratoId as string | undefined;
  const titulo = (body?.titulo as string | undefined)?.trim();
  const descricao = (body?.descricao as string | undefined)?.trim();
  const categoria = (body?.categoria as string | undefined) ?? 'outros';
  const urgencia = (body?.urgencia as string | undefined) ?? 'normal';

  if (!contratoId || !titulo || !descricao) {
    return NextResponse.json({ error: 'Preencha título e descrição.' }, { status: 400 });
  }

  const contrato = await prisma.contrato.findFirst({
    where: { id: contratoId, userIdInquilino: session.user.id },
    include: { imovel: { include: { proprietario: true } } },
  });
  if (!contrato) return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });

  const manutencao = await prisma.manutencao.create({
    data: {
      imobiliariaId: contrato.imobiliariaId,
      imovelId: contrato.imovelId,
      solicitanteId: session.user.id,
      proprietarioId: contrato.imovel.proprietarioId,
      titulo,
      descricao,
      categoria,
      urgencia,
      status: 'aberta',
    },
  });

  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      acao: 'manutencao.abrir',
      entidade: 'Manutencao',
      entidadeId: manutencao.id,
      dadosNovos: { titulo, categoria, urgencia },
    },
  });

  if (contrato.imovel.proprietario?.email) {
    await sendEmail({
      to: contrato.imovel.proprietario.email,
      subject: `Nova solicitação de manutenção — ${contrato.imovel.codigo}`,
      html: `<p>Olá ${contrato.imovel.proprietario.nome},</p><p>Foi aberta uma solicitação de manutenção no imóvel <strong>${contrato.imovel.codigo}</strong>:</p><p><strong>${titulo}</strong></p><p>${descricao}</p><p>Urgência: ${urgencia}</p>`,
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, manutencao });
}
