import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const imob = await prisma.imobiliaria.findFirst();
  return NextResponse.json(imob);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }
  const b = await request.json();
  const data = {
    nome: String(b?.nome ?? ''),
    cnpj: b?.cnpj ? String(b.cnpj) : null,
    email: b?.email ? String(b.email) : null,
    telefone: b?.telefone ? String(b.telefone) : null,
    endereco: b?.endereco ? String(b.endereco) : null,
    taxaAdministracaoPct: Number(b?.taxaAdministracaoPct ?? 8),
    diaRepasse: Number(b?.diaRepasse ?? 10),
  };
  const existente = await prisma.imobiliaria.findFirst();
  const imob = existente
    ? await prisma.imobiliaria.update({ where: { id: existente.id }, data })
    : await prisma.imobiliaria.create({ data });
  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      acao: 'atualizar_imobiliaria',
      entidade: 'Imobiliaria',
      entidadeId: imob.id,
      dadosNovos: data,
    },
  });
  return NextResponse.json({ ok: true, imob });
}
