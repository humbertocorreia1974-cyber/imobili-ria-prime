import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const body = await request.json();
  const role = String(body?.role ?? '');
  const validos = ['admin', 'corretor', 'proprietario', 'inquilino', 'user'];
  if (!validos.includes(role)) {
    return NextResponse.json({ error: 'Papel inválido' }, { status: 400 });
  }
  const user = await prisma.user.update({ where: { id: params.id }, data: { role } });
  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      acao: 'alterar_role',
      entidade: 'User',
      entidadeId: user.id,
      dadosNovos: { role },
    },
  });
  return NextResponse.json({ ok: true, user: { id: user.id, role: user.role } });
}
