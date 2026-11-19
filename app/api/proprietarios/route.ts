import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!['admin', 'corretor'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const proprietarios = await prisma.proprietario.findMany({
    include: { _count: { select: { imoveis: true, repasses: true } } },
    orderBy: { nome: 'asc' },
  });
  return NextResponse.json(proprietarios);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!['admin', 'corretor'].includes(session.user.role ?? '')) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const body = await request.json();
  const { nome, cpfCnpj, email, telefone, endereco, banco, agencia, conta, pixChave, observacoes } = body;

  if (!nome || !cpfCnpj || !email || !telefone) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
  }

  const imobiliaria = await prisma.imobiliaria.findFirst();
  if (!imobiliaria) {
    return NextResponse.json({ error: 'Imobiliária não configurada' }, { status: 400 });
  }

  const existente = await prisma.proprietario.findUnique({ where: { cpfCnpj } });
  if (existente) {
    return NextResponse.json({ error: 'CPF/CNPJ já cadastrado' }, { status: 409 });
  }

  const proprietario = await prisma.proprietario.create({
    data: {
      imobiliariaId: imobiliaria.id,
      nome,
      cpfCnpj,
      email,
      telefone,
      endereco: endereco || null,
      banco: banco || null,
      agencia: agencia || null,
      conta: conta || null,
      pixChave: pixChave || null,
      observacoes: observacoes || null,
    },
  });

  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      acao: 'criar',
      entidade: 'Proprietario',
      entidadeId: proprietario.id,
      dadosNovos: { nome, cpfCnpj, email },
    },
  });

  return NextResponse.json(proprietario, { status: 201 });
}
