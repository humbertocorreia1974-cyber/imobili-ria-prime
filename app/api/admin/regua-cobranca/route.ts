import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const body = await request.json();
  const regua = {
    d0: String(body?.d0 ?? ''),
    d1: String(body?.d1 ?? ''),
    d5: String(body?.d5 ?? ''),
    d10: String(body?.d10 ?? ''),
    d30: String(body?.d30 ?? ''),
  };
  const imob = await prisma.imobiliaria.findFirst();
  if (!imob) return NextResponse.json({ error: 'Imobiliária não configurada' }, { status: 404 });
  await prisma.imobiliaria.update({ where: { id: imob.id }, data: { reguaCobranca: regua } });
  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      acao: 'alterar_regua_cobranca',
      entidade: 'Imobiliaria',
      entidadeId: imob.id,
      dadosNovos: regua,
    },
  });
  return NextResponse.json({ ok: true });
}
