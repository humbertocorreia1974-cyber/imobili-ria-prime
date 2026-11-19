import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.url) return NextResponse.json({ error: 'URL obrigatória' }, { status: 400 });

  const imovel = await prisma.imovel.findUnique({ where: { id: params.id } });
  if (!imovel) return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });

  const count = await prisma.propertyMedia.count({ where: { imovelId: params.id } });
  const midia = await prisma.propertyMedia.create({
    data: {
      imovelId: params.id,
      url: String(body.url),
      legenda: body.legenda ? String(body.legenda) : null,
      tipo: body.tipo ? String(body.tipo) : 'foto',
      ordem: count,
      principal: count === 0,
    },
  });

  return NextResponse.json({ ok: true, midia });
}
