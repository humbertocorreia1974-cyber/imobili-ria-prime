import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Building2, Plus, MapPin, User, TrendingUp } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'CRM de Imóveis | Imobiliária Prime',
  description: 'Gestão completa do portfólio de imóveis para locação e venda.',
  openGraph: { title: 'CRM de Imóveis | Imobiliária Prime', description: 'Portfólio completo de locação e venda.' },
};

const brl = (v: any) => v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v)) : '—';

const situacaoStyle: Record<string, string> = {
  disponivel: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  reservado: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  locado: 'bg-brand/10 text-brand border-brand/20',
  vendido: 'bg-fg-muted/10 text-fg-muted border-border',
};

export default async function ImoveisPage({ searchParams }: { searchParams: { situacao?: string; tipo?: string; finalidade?: string; q?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const where: any = {};
  if (searchParams.situacao) where.situacao = searchParams.situacao;
  if (searchParams.tipo) where.tipo = searchParams.tipo;
  if (searchParams.finalidade) where.finalidade = searchParams.finalidade;
  if (searchParams.q) where.OR = [
    { titulo: { contains: searchParams.q, mode: 'insensitive' } },
    { codigo: { contains: searchParams.q, mode: 'insensitive' } },
    { bairro: { contains: searchParams.q, mode: 'insensitive' } },
  ];

  const [imoveis, total, disponiveis, locados, vendidos] = await Promise.all([
    prisma.imovel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: {
        proprietario: { select: { nome: true } },
        corretor: { select: { nome: true } },
        midias: { where: { principal: true }, take: 1 },
      },
    }),
    prisma.imovel.count(),
    prisma.imovel.count({ where: { situacao: 'disponivel' } }),
    prisma.imovel.count({ where: { situacao: 'locado' } }),
    prisma.imovel.count({ where: { situacao: 'vendido' } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-fg-muted">CRM</p>
          <h1 className="mt-1 text-3xl font-semibold text-fg">Imóveis</h1>
          <p className="mt-1 text-sm text-fg-muted">Portfólio completo de locação e venda com vínculo de proprietário e corretor.</p>
        </div>
        <Link href="/imoveis/novo">
          <Button variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" /> Novo imóvel
          </Button>
        </Link>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: total, icon: Building2, tone: 'text-fg' },
          { label: 'Disponíveis', value: disponiveis, icon: TrendingUp, tone: 'text-emerald-500' },
          { label: 'Locados', value: locados, icon: Building2, tone: 'text-brand' },
          { label: 'Vendidos', value: vendidos, icon: Building2, tone: 'text-fg-muted' },
        ].map((k) => (
          <Card key={k.label}>
            <CardBody className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-fg-muted">{k.label}</p>
                <p className={`mt-1 text-2xl font-semibold ${k.tone}`}>{k.value}</p>
              </div>
              <k.icon className="h-8 w-8 text-fg-muted/40" />
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardBody>
          <form className="grid gap-3 sm:grid-cols-4">
            <input
              name="q"
              defaultValue={searchParams.q ?? ''}
              placeholder="Buscar por título, código ou bairro"
              className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            <select name="situacao" defaultValue={searchParams.situacao ?? ''} className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg">
              <option value="">Todas as situações</option>
              <option value="disponivel">Disponível</option>
              <option value="reservado">Reservado</option>
              <option value="locado">Locado</option>
              <option value="vendido">Vendido</option>
            </select>
            <select name="tipo" defaultValue={searchParams.tipo ?? ''} className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg">
              <option value="">Todos os tipos</option>
              <option value="apartamento">Apartamento</option>
              <option value="casa">Casa</option>
              <option value="terreno">Terreno</option>
              <option value="comercial">Comercial</option>
            </select>
            <select name="finalidade" defaultValue={searchParams.finalidade ?? ''} className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg">
              <option value="">Todas as finalidades</option>
              <option value="locacao">Locação</option>
              <option value="venda">Venda</option>
              <option value="ambos">Ambos</option>
            </select>
            <div className="sm:col-span-4 flex justify-end">
              <Button variant="secondary" size="sm" type="submit">Filtrar</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {imoveis.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center">
            <Building2 className="mx-auto h-12 w-12 text-fg-muted/40" />
            <h3 className="mt-4 text-lg font-medium text-fg">Nenhum imóvel encontrado</h3>
            <p className="mt-1 text-sm text-fg-muted">Cadastre o primeiro imóvel para começar a operar locação e venda.</p>
            <Link href="/imoveis/novo" className="mt-6 inline-block">
              <Button variant="primary" size="md"><Plus className="mr-2 h-4 w-4" /> Cadastrar imóvel</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                <tr>
                  <th className="px-4 py-3">Imóvel</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3">Finalidade</th>
                  <th className="px-4 py-3">Proprietário</th>
                  <th className="px-4 py-3">Corretor</th>
                  <th className="px-4 py-3 text-right">Aluguel</th>
                  <th className="px-4 py-3 text-right">Venda</th>
                </tr>
              </thead>
              <tbody>
                {imoveis.map((i) => (
                  <tr key={i.id} className="border-b border-border/60 transition-colors hover:bg-white/5">
                    <td className="px-4 py-3">
                      <Link href={`/imoveis/${i.id}`} className="block">
                        <p className="font-medium text-fg">{i.titulo}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-fg-muted">
                          <span className="font-mono">{i.codigo}</span>
                          {i.bairro && (<><span>·</span><MapPin className="h-3 w-3" />{i.bairro}</>)}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs capitalize ${situacaoStyle[i.situacao] ?? 'bg-fg-muted/10 text-fg-muted border-border'}`}>
                        {i.situacao}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-fg-muted">{i.finalidade}</td>
                    <td className="px-4 py-3 text-fg-muted">
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{i.proprietario.nome}</span>
                    </td>
                    <td className="px-4 py-3 text-fg-muted">{i.corretor?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-fg">{brl(i.valorAluguel)}</td>
                    <td className="px-4 py-3 text-right font-medium text-fg">{brl(i.valorVenda)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
