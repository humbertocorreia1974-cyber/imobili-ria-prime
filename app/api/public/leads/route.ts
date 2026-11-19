import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nome = String(body.nome ?? '').trim();
    const telefone = String(body.telefone ?? '').trim();
    const email = body.email ? String(body.email).trim() : null;
    const interesseTipo = body.interesseTipo ? String(body.interesseTipo) : null;
    const observacoes = body.observacoes ? String(body.observacoes) : null;

    if (!nome || !telefone) {
      return NextResponse.json({ error: 'Nome e telefone são obrigatórios' }, { status: 400 });
    }

    const imobiliaria = await prisma.imobiliaria.findFirst();
    if (!imobiliaria) {
      return NextResponse.json({ error: 'Imobiliária não configurada' }, { status: 500 });
    }

    const scoreInicial = 10;
    const cliente = await prisma.cliente.create({
      data: {
        imobiliariaId: imobiliaria.id,
        nome,
        telefone,
        email,
        origem: 'landing',
        interesseTipo,
        observacoes,
        scoreLead: scoreInicial,
        scoreUltimaAtualizacao: new Date(),
        interacoes: {
          create: {
            tipo: 'lead_landing',
            descricao: 'Lead capturado pela landing institucional',
            pontosScore: scoreInicial,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, id: cliente.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erro ao criar lead' }, { status: 500 });
  }
}
