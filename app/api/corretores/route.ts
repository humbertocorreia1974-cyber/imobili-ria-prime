import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const corretores = await prisma.corretor.findMany({ orderBy: { nome: 'asc' } });
  return NextResponse.json({ corretores });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body?.nome || !body?.email || !body?.telefone) {
    return NextResponse.json({ error: 'nome, email e telefone são obrigatórios' }, { status: 400 });
  }

  const imob = await prisma.imobiliaria.findFirst();
  if (!imob) return NextResponse.json({ error: 'Imobiliária não configurada' }, { status: 400 });

  const corretor = await prisma.corretor.create({
    data: {
      imobiliariaId: imob.id,
      nome: body.nome,
      email: body.email,
      telefone: body.telefone,
      creci: body.creci ?? null,
      comissaoPadraoPct: body.comissaoPadraoPct ?? 6,
      metaMensal: body.metaMensal ?? null,
      ativo: true,
    },
  });

  await prisma.logAuditoria.create({
    data: { userId: session.user.id, acao: 'criar', entidade: 'Corretor', entidadeId: corretor.id },
  }).catch(() => {});

  return NextResponse.json({ ok: true, corretor });
}
