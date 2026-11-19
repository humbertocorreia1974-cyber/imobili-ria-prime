import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PropostaAcoes } from './proposta-acoes-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Propostas | Imobiliária Prime',
  description: 'Fluxo de propostas de locação e compra com contraproposta e aprovação do proprietário.',
  openGraph: { title: 'Propostas | Imobiliária Prime', description: 'Aprovação de propostas com contraproposta.' },
};

const brl = (v: unknown) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dt = (d: Date) => new Date(d).toLocaleDateString('pt-BR');

const STATUS_LABEL: Record<string, string> = {
  em_analise: 'Em análise',
  contraproposta: 'Contraproposta',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  cancelada: 'Cancelada',
  convertida: 'Convertida',
};

const STATUS_CLASS: Record<string, string> = {
  em_analise: 'bg-amber-500/10 text-amber-600',
  contraproposta: 'bg-brand/10 text-brand',
  aprovada: 'bg-emerald-500/10 text-emerald-600',
  rejeitada: 'bg-red-500/10 text-red-600',
  cancelada: 'bg-fg-muted/10 text-fg-muted',
  convertida: 'bg-emerald-500/10 text-emerald-700',
};

export default async function PropostasPage({
  searchParams,
}: {
  searchParams: { status?: string; tipo?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const role = session.user.role;
  const where: Record<string, unknown> = {};
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.tipo) where.tipo = searchParams.tipo;

  if (role === 'corretor') {
    const corretor = await prisma.corretor.findUnique({ where: { userId: session.user.id } });
    if (corretor) where.corretorId = corretor.id;
  } else if (role === 'proprietario') {
    const prop = await prisma.proprietario.findUnique({ where: { userId: session.user.id } });
    if (prop) where.proprietarioId = prop.id;
  }

  const propostas = await prisma.proposta.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 60,
    include: {
      imovel: { select: { id: true, codigo: true, titulo: true, cidade: true, bairro: true } },
      cliente: { select: { id: true, nome: true, telefone: true, scoreLead: true } },
      corretor: { select: { id: true, nome: true } },
      proprietario: { select: { id: true, nome: true } },
      _count: { select: { contrapropostas: true } },
    },
  });

  const podeAprovar = role === 'admin' || role === 'proprietario';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Propostas</h1>
          <p className="text-sm text-fg-muted">
            {propostas.length} proposta{propostas.length === 1 ? '' : 's'} · locação e compra no mesmo fluxo
          </p>
        </div>
        <Link href="/imoveis">
          <Button variant="primary" size="md">Nova proposta via imóvel</Button>
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap gap-3" action="/propostas" method="get">
        <select
          name="status"
          defaultValue={searchParams.status ?? ''}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          name="tipo"
          defaultValue={searchParams.tipo ?? ''}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
        >
          <option value="">Locação e compra</option>
          <option value="locacao">Locação</option>
          <option value="compra">Compra</option>
        </select>
        <Button type="submit" variant="secondary" size="md">Filtrar</Button>
      </form>

      {propostas.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-fg-muted">
              Nenhuma proposta encontrada com esses filtros. Abra a ficha de um imóvel para registrar a primeira proposta.
            </p>
            <div className="mt-4">
              <Link href="/imoveis"><Button variant="primary" size="sm">Ver imóveis</Button></Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {propostas.map((p) => (
            <Card key={p.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[p.status] ?? 'bg-fg-muted/10 text-fg-muted'}`}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                        {p.tipo === 'locacao' ? 'Locação' : 'Compra'}
                      </span>
                      {p._count.contrapropostas > 0 && (
                        <span className="text-xs text-fg-muted">
                          {p._count.contrapropostas} contraproposta{p._count.contrapropostas === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 truncate text-base font-medium text-fg">
                      {p.imovel.codigo} · {p.imovel.titulo}
                    </h2>
                    <p className="text-xs text-fg-muted">
                      {p.imovel.bairro ?? '—'}, {p.imovel.cidade ?? '—'} · Cliente: {p.cliente.nome} (score {p.cliente.scoreLead})
                      {p.corretor ? ` · Corretor: ${p.corretor.nome}` : ''}
                      {p.proprietario ? ` · Dono: ${p.proprietario.nome}` : ''}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-fg-muted">Valor</p>
                        <p className="font-medium text-fg">{brl(p.valor)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-fg-muted">Garantia</p>
                        <p className="text-fg">{p.garantiaTipo ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-fg-muted">Prazo</p>
                        <p className="text-fg">{p.prazoMeses ? `${p.prazoMeses} meses` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-fg-muted">Criada em</p>
                        <p className="text-fg">{dt(p.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <PropostaAcoes
                    propostaId={p.id}
                    status={p.status}
                    valorAtual={Number(p.valor)}
                    podeAprovar={podeAprovar}
                  />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
