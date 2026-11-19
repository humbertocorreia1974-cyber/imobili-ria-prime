import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Plus } from 'lucide-react';
import VistoriaAcoesClient from './vistoria-acoes-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Vistorias | Imobiliária Prime',
  description: 'Vistorias de entrada e saída com checklist por cômodo, foto obrigatória e comparativo.',
  openGraph: { title: 'Vistorias | Imobiliária Prime', description: 'Checklist por cômodo com foto obrigatória.' },
};

const fmtDate = (d: Date | null | undefined) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');

export default async function VistoriasPage({ searchParams }: { searchParams: { tipo?: string; status?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const where: any = {};
  if (searchParams.tipo) where.tipo = searchParams.tipo;
  if (searchParams.status) where.status = searchParams.status;

  const vistorias = await prisma.vistoria.findMany({
    where,
    orderBy: { dataVistoria: 'desc' },
    take: 100,
    include: {
      imovel: { select: { codigo: true, titulo: true } },
      contrato: { select: { numero: true } },
      responsavel: { select: { name: true } },
      _count: { select: { itens: true } },
    },
  });

  const imoveis = await prisma.imovel.findMany({
    where: { situacao: { in: ['locado', 'vendido', 'disponivel'] } },
    select: { id: true, codigo: true, titulo: true },
    orderBy: { codigo: 'asc' },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Vistorias</h1>
          <p className="text-sm text-fg-muted">Entrada e saída · checklist por cômodo · foto obrigatória</p>
        </div>
        <VistoriaAcoesClient mode="nova" imoveis={imoveis} />
      </header>

      <Card className="mb-4">
        <CardBody>
          <form className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-xs text-fg-muted">
              Tipo
              <select name="tipo" defaultValue={searchParams.tipo ?? ''} className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
                <option value="">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </label>
            <label className="flex flex-col text-xs text-fg-muted">
              Status
              <select name="status" defaultValue={searchParams.status ?? ''} className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
                <option value="">Todos</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluida">Concluída</option>
                <option value="assinada">Assinada</option>
                <option value="contestada">Contestada</option>
              </select>
            </label>
            <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
          </form>
        </CardBody>
      </Card>

      {vistorias.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-fg-muted" />
            <p className="text-sm text-fg">Nenhuma vistoria registrada.</p>
            <p className="mb-4 text-xs text-fg-muted">Abra uma vistoria de entrada para iniciar o checklist.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vistorias.map((v) => (
            <Card key={v.id}>
              <CardBody>
                <div className="mb-2 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    v.tipo === 'entrada' ? 'bg-brand/10 text-brand' : 'bg-accent/10 text-accent'
                  }`}>{v.tipo}</span>
                  <span className="text-xs text-fg-muted">{fmtDate(v.dataVistoria)}</span>
                </div>
                <h3 className="font-medium text-fg">{v.imovel.codigo}</h3>
                <p className="mb-2 text-xs text-fg-muted">{v.imovel.titulo}</p>
                <div className="mb-3 space-y-1 text-xs text-fg-muted">
                  <p>Contrato: {v.contrato?.numero ?? '—'}</p>
                  <p>Responsável: {v.responsavel?.name ?? '—'}</p>
                  <p>Itens: {v._count.itens}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    v.status === 'concluida' || v.status === 'assinada' ? 'bg-brand/10 text-brand'
                    : v.status === 'contestada' ? 'bg-red-500/10 text-red-400'
                    : 'bg-fg-muted/10 text-fg-muted'
                  }`}>{v.status}</span>
                  <Link href={`/vistorias/${v.id}`}>
                    <Button size="sm" variant="ghost">Abrir</Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
