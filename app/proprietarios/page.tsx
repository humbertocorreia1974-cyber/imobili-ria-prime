import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Building2, Plus, Search, Wallet, TrendingUp } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Proprietários | Imobiliária Prime',
  description: 'CRM de proprietários: cadastro, imóveis vinculados e histórico de repasses.',
  openGraph: { title: 'Proprietários | Imobiliária Prime', description: 'Gestão completa de proprietários.' },
};

const brl = (v: number | string | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v ?? 0));

export default async function ProprietariosPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (!['admin', 'corretor'].includes(session.user.role ?? '')) redirect('/');

  const q = searchParams.q?.trim() ?? '';

  const proprietarios = await prisma.proprietario.findMany({
    where: q
      ? {
          OR: [
            { nome: { contains: q, mode: 'insensitive' } },
            { cpfCnpj: { contains: q } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: {
      _count: { select: { imoveis: true, repasses: true } },
      repasses: {
        where: { status: 'pendente' },
        select: { valorLiquido: true },
      },
    },
    orderBy: { nome: 'asc' },
    take: 100,
  });

  const totalImoveis = proprietarios.reduce((s, p) => s + p._count.imoveis, 0);
  const totalPendente = proprietarios.reduce(
    (s, p) => s + p.repasses.reduce((a, r) => a + Number(r.valorLiquido), 0),
    0,
  );

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-fg-muted">CRM</p>
            <h1 className="mt-1 text-3xl font-semibold text-fg">Proprietários</h1>
            <p className="mt-1 text-sm text-fg-muted">
              Cadastro, imóveis vinculados e histórico de repasses.
            </p>
          </div>
          <Link href="/proprietarios/novo">
            <Button variant="primary" size="md">
              <Plus className="mr-2 h-4 w-4" /> Novo proprietário
            </Button>
          </Link>
        </header>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand/10 p-2 text-brand">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-fg-muted">Proprietários</p>
                  <p className="text-2xl font-semibold text-fg">{proprietarios.length}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent/10 p-2 text-accent">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-fg-muted">Imóveis vinculados</p>
                  <p className="text-2xl font-semibold text-fg">{totalImoveis}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand/10 p-2 text-brand">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-fg-muted">Repasses pendentes</p>
                  <p className="text-2xl font-semibold text-fg">{brl(totalPendente)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="mb-6">
          <CardBody>
            <form className="flex flex-wrap items-center gap-3" action="/proprietarios">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary" size="md">
                Filtrar
              </Button>
            </form>
          </CardBody>
        </Card>

        {proprietarios.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center">
              <Building2 className="mx-auto mb-4 h-10 w-10 text-fg-muted" />
              <CardTitle className="mb-2">Nenhum proprietário cadastrado</CardTitle>
              <p className="mb-6 text-sm text-fg-muted">
                Cadastre o primeiro proprietário para vincular imóveis e gerar repasses.
              </p>
              <Link href="/proprietarios/novo">
                <Button variant="primary" size="md">
                  <Plus className="mr-2 h-4 w-4" /> Cadastrar proprietário
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
                    <th className="px-4 py-3">CPF/CNPJ</th>
                    <th className="px-4 py-3">Contato</th>
                    <th className="px-4 py-3 text-right">Imóveis</th>
                    <th className="px-4 py-3 text-right">Repasses pendentes</th>
                    <th className="px-4 py-3">PIX</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {proprietarios.map((p) => {
                    const pendente = p.repasses.reduce((a, r) => a + Number(r.valorLiquido), 0);
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-border/50 transition-colors duration-150 hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-medium text-fg">{p.nome}</td>
                        <td className="px-4 py-3 text-fg-muted">{p.cpfCnpj}</td>
                        <td className="px-4 py-3 text-fg-muted">
                          <div>{p.email}</div>
                          <div className="text-xs">{p.telefone}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-fg">{p._count.imoveis}</td>
                        <td className="px-4 py-3 text-right">
                          {pendente > 0 ? (
                            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                              {brl(pendente)}
                            </span>
                          ) : (
                            <span className="text-xs text-fg-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-fg-muted">
                          {p.pixChave ? p.pixChave.slice(0, 20) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/proprietarios/${p.id}`}
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
