import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Users, Plus, Search, Flame, Snowflake, Sun } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Clientes e Interessados | Imobiliária Prime',
  description: 'CRM de leads com score automático, origem e faixa de interesse.',
  openGraph: { title: 'Clientes | Imobiliária Prime', description: 'Gestão de leads com score.' },
};

function scoreBadge(score: number) {
  if (score >= 70) return { label: 'Quente', cls: 'bg-red-500/10 text-red-400', Icon: Flame };
  if (score >= 40) return { label: 'Morno', cls: 'bg-accent/10 text-accent', Icon: Sun };
  return { label: 'Frio', cls: 'bg-brand/10 text-brand', Icon: Snowflake };
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: { q?: string; origem?: string; faixa?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (!['admin', 'corretor'].includes(session.user.role ?? '')) redirect('/');

  const q = searchParams.q?.trim() ?? '';
  const origem = searchParams.origem ?? '';
  const faixa = searchParams.faixa ?? '';

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { telefone: { contains: q } },
    ];
  }
  if (origem) where.origem = origem;
  if (faixa === 'quente') where.scoreLead = { gte: 70 };
  else if (faixa === 'morno') where.scoreLead = { gte: 40, lt: 70 };
  else if (faixa === 'frio') where.scoreLead = { lt: 40 };

  const clientes = await prisma.cliente.findMany({
    where,
    include: { _count: { select: { visitas: true, propostas: true, interacoes: true } } },
    orderBy: { scoreLead: 'desc' },
    take: 100,
  });

  const quentes = clientes.filter((c) => c.scoreLead >= 70).length;
  const mornos = clientes.filter((c) => c.scoreLead >= 40 && c.scoreLead < 70).length;
  const frios = clientes.filter((c) => c.scoreLead < 40).length;

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-fg-muted">CRM</p>
            <h1 className="mt-1 text-3xl font-semibold text-fg">Clientes e Interessados</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Leads com score automático baseado em interações e completude do cadastro.
            </p>
          </div>
          <Link href="/clientes/novo">
            <Button variant="primary" size="md">
              <Plus className="mr-2 h-4 w-4" /> Novo cliente
            </Button>
          </Link>
        </header>

        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand/10 p-2 text-brand">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-fg-muted">Total</p>
                  <p className="text-2xl font-semibold text-fg">{clientes.length}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-fg-muted">Quentes</p>
                  <p className="text-2xl font-semibold text-fg">{quentes}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent/10 p-2 text-accent">
                  <Sun className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-fg-muted">Mornos</p>
                  <p className="text-2xl font-semibold text-fg">{mornos}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand/10 p-2 text-brand">
                  <Snowflake className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-fg-muted">Frios</p>
                  <p className="text-2xl font-semibold text-fg">{frios}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="mb-6">
          <CardBody>
            <form className="flex flex-wrap items-end gap-3" action="/clientes">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
                <Input name="q" defaultValue={q} placeholder="Buscar por nome, e-mail ou telefone..." className="pl-9" />
              </div>
              <select
                name="origem"
                defaultValue={origem}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
              >
                <option value="">Todas as origens</option>
                <option value="landing">Landing</option>
                <option value="indicacao">Indicação</option>
                <option value="portal">Portal</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="presencial">Presencial</option>
              </select>
              <select
                name="faixa"
                defaultValue={faixa}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
              >
                <option value="">Todos os scores</option>
                <option value="quente">Quente (70+)</option>
                <option value="morno">Morno (40-69)</option>
                <option value="frio">Frio (&lt;40)</option>
              </select>
              <Button type="submit" variant="secondary" size="md">
                Filtrar
              </Button>
            </form>
          </CardBody>
        </Card>

        {clientes.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center">
              <Users className="mx-auto mb-4 h-10 w-10 text-fg-muted" />
              <CardTitle className="mb-2">Nenhum cliente encontrado</CardTitle>
              <p className="mb-6 text-sm text-fg-muted">
                Cadastre um lead ou ajuste os filtros para ver resultados.
              </p>
              <Link href="/clientes/novo">
                <Button variant="primary" size="md">
                  <Plus className="mr-2 h-4 w-4" /> Cadastrar cliente
                </Button>
              </Link>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-muted">
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Contato</th>
                    <th className="px-4 py-3">Origem</th>
                    <th className="px-4 py-3">Interesse</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3 text-right">Visitas</th>
                    <th className="px-4 py-3 text-right">Propostas</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => {
                    const badge = scoreBadge(c.scoreLead);
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-border/50 transition-colors duration-150 hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-medium text-fg">{c.nome}</td>
                        <td className="px-4 py-3 text-fg-muted">
                          <div>{c.telefone}</div>
                          {c.email && <div className="text-xs">{c.email}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs capitalize text-fg-muted">{c.origem}</td>
                        <td className="px-4 py-3 text-fg-muted">
                          {c.interesseTipo ?? '—'}
                          {c.faixaPrecoMax && (
                            <div className="text-xs">
                              até {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(c.faixaPrecoMax))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                            <badge.Icon className="h-3 w-3" />
                            {c.scoreLead} · {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-fg">{c._count.visitas}</td>
                        <td className="px-4 py-3 text-right text-fg">{c._count.propostas}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/clientes/${c.id}`}
                            className="text-sm text-brand transition-colors duration-150 hover:text-brand/80"
                          >
                            Ver detalhe
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
