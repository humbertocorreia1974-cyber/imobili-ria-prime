import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import CorretorFormClient from './corretor-form-client';

export const metadata = { title: "Corretores · Imobiliária Prime", description: "Plataforma operacional completa de imobiliária (locação + venda) com CRM, financeiro, portais do proprietário e inquilino, e app do corretor. Visual azul-p", openGraph: { title: "Corretores · Imobiliária Prime", description: "Plataforma operacional completa de imobiliária (locação + venda) com CRM, financeiro, portais do proprietário e inquilino, e app do corretor. Visual azul-p" } };



export const dynamic = 'force-dynamic';

const brl = (v: any) => v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v));

export default async function Page({ searchParams }: { searchParams: { q?: string; ativo?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const where: any = {};
  if (searchParams.q) {
    where.OR = [
      { nome: { contains: searchParams.q, mode: 'insensitive' } },
      { creci: { contains: searchParams.q, mode: 'insensitive' } },
    ];
  }
  if (searchParams.ativo === '1') where.ativo = true;
  if (searchParams.ativo === '0') where.ativo = false;

  const corretores = await prisma.corretor.findMany({
    where,
    orderBy: { nome: 'asc' },
    include: {
      _count: { select: { imoveisCarteira: true, visitas: true, propostas: true, contratos: true } },
      comissoes: { where: { status: { in: ['pendente', 'aprovada'] } }, select: { valor: true } },
    },
  });

  const totalComissoesPendentes = corretores.reduce(
    (acc, c) => acc + c.comissoes.reduce((s, x) => s + Number(x.valor), 0),
    0
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-fg">CRM de Corretores</h1>
          <p className="text-sm text-fg-muted">Carteira, comissões e metas da equipe.</p>
        </div>
        <div className="rounded-lg border border-border bg-surface/70 px-4 py-2 text-sm">
          <span className="text-fg-muted">Comissões a pagar: </span>
          <span className="font-semibold text-brand">{brl(totalComissoesPendentes)}</span>
        </div>
      </div>

      <Card>
        <CardBody>
          <form className="flex flex-wrap gap-2" method="get">
            <input
              name="q"
              defaultValue={searchParams.q ?? ''}
              placeholder="Buscar por nome ou CRECI"
              className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            />
            <select name="ativo" defaultValue={searchParams.ativo ?? ''} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
              <option value="">Todos</option>
              <option value="1">Ativos</option>
              <option value="0">Inativos</option>
            </select>
            <button type="submit" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition-colors duration-150 hover:bg-brand/90">
              Filtrar
            </button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardTitle>Corretores ({corretores.length})</CardTitle>
        <CardBody>
          {corretores.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-8 text-center">
              <p className="text-sm text-fg-muted">Nenhum corretor encontrado com esses filtros.</p>
              <p className="mt-1 text-xs text-fg-muted">Cadastre o primeiro corretor no formulário abaixo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-fg-muted">
                  <tr>
                    <th className="py-2">Nome</th>
                    <th>CRECI</th>
                    <th>Imóveis</th>
                    <th>Visitas</th>
                    <th>Propostas</th>
                    <th>Comissão pendente</th>
                    <th>Meta mensal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {corretores.map((c) => {
                    const pendente = c.comissoes.reduce((s, x) => s + Number(x.valor), 0);
                    const meta = c.metaMensal ? Number(c.metaMensal) : null;
                    const pct = meta ? Math.min(100, Math.round((pendente / meta) * 100)) : 0;
                    return (
                      <tr key={c.id} className="border-t border-border">
                        <td className="py-2">
                          <p className="text-fg">{c.nome}</p>
                          <p className="text-xs text-fg-muted">{c.email}</p>
                        </td>
                        <td className="text-fg-muted">{c.creci ?? '—'}</td>
                        <td className="text-fg">{c._count.imoveisCarteira}</td>
                        <td className="text-fg">{c._count.visitas}</td>
                        <td className="text-fg">{c._count.propostas}</td>
                        <td className="text-fg">{brl(pendente)}</td>
                        <td>
                          {meta ? (
                            <div className="w-32">
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface/70">
                                <div className="h-full bg-brand transition-all duration-300" style={{ width: `${pct}%` }} />
                              </div>
                              <p className="mt-1 text-xs text-fg-muted">{pct}% de {brl(meta)}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-fg-muted">Sem meta</span>
                          )}
                        </td>
                        <td>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${c.ativo ? 'bg-brand/10 text-brand' : 'bg-surface/70 text-fg-muted'}`}>
                            {c.ativo ? 'ativo' : 'inativo'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardTitle>Novo corretor</CardTitle>
        <CardBody>
          <CorretorFormClient />
        </CardBody>
      </Card>
    </div>
  );
}
