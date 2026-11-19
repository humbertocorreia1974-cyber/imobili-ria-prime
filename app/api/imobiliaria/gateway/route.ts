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
  const b = await request.json();
  const data = {
    gatewayProvider: String(b?.gatewayProvider ?? 'asaas'),
    gatewayApiKey: b?.gatewayApiKey ? String(b.gatewayApiKey) : null,
    clicksignEnabled: Boolean(b?.clicksignEnabled),
    clicksignToken: b?.clicksignToken ? String(b.clicksignToken) : null,
    whatsappEnabled: Boolean(b?.whatsappEnabled),
    whatsappPhoneId: b?.whatsappPhoneId ? String(b.whatsappPhoneId) : null,
    whatsappToken: b?.whatsappToken ? String(b.whatsappToken) : null,
  };
  const existente = await prisma.imobiliaria.findFirst();
  if (!existente) return NextResponse.json({ error: 'Imobiliária não configurada' }, { status: 404 });
  await prisma.imobiliaria.update({ where: { id: existente.id }, data });
  await prisma.logAuditoria.create({
    data: {
      userId: session.user.id,
      acao: 'atualizar_gateway',
      entidade: 'Imobiliaria',
      entidadeId: existente.id,
      dadosNovos: { gatewayProvider: data.gatewayProvider, clicksignEnabled: data.clicksignEnabled, whatsappEnabled: data.whatsappEnabled },
    },
  });
  return NextResponse.json({ ok: true });
}
