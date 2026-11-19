import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const VALIDOS = ['admin', 'corretor', 'proprietario', 'inquilino'];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!["corretor","proprietario","inquilino","admin","master","owner","superadmin"].includes((session?.user as any)?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const role = String(body.role ?? '');
  if (!VALIDOS.includes(role)) {
    return NextResponse.json({ error: 'Papel inválido' }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { role },
  });
  return NextResponse.json({ ok: true, role });
}
