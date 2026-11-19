import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const valor = Number(body?.valor);
  if (!Number.isFinite(valor) || valor <= 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
  }

  const proposta = await prisma.proposta.findUnique({ where: { id: params.id } });
  if (!proposta) return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });

  const role = session.user.role;
  if (role === 'proprietario') {
    const prop = await prisma.proprietario.findUnique({ where: { userId: session.user.id } });
    if (!prop || proposta.proprietarioId !== prop.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }
  } else if (role === 'corretor') {
    const corretor = await prisma.corretor.findUnique({ where: { userId: session.user.id } });
    if (!corretor || proposta.corretorId !== corretor.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }
  } else if (role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
  }

  const contra = await prisma.contraproposta.create({
    data: {
      propostaId: params.id,
      autorId: session.user.id,
      autorTipo: String(body?.autorTipo ?? 'corretor'),
      valor,
      mensagem: body?.mensagem ? String(body.mensagem) : null,
      status: 'pendente',
    },
  });

  await prisma.proposta.update({
    where: { id: params.id },
    data: { status: 'contraproposta' },
  });

  return NextResponse.json({ ok: true, contraproposta: contra });
}
