import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, FileText, Wallet, TrendingUp, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'App do Corretor | Imobiliária Prime',
  description: 'Carteira, visitas, propostas e comissões do corretor em um só lugar.',
};

const fmt = (v: number | string | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v ?? 0));

export default async function CorretorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const corretor = await prisma.corretor.findUnique({
    where: { userId: session.user.id },
    include: {
      imoveisCarteira: { take: 6, orderBy: { createdAt: 'desc' } },
      comissoes: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  if (!corretor) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Card>
          <CardBody>
            <h1 className="text-xl font-semibold text-fg">Perfil de corretor não encontrado</h1>
            <p className="mt-2 text-sm text-fg-muted">
              Sua conta ainda não está vinculada a um corretor. Fale com o administrador da imobiliária.
            </p>
            <Link href="/" className="mt-4 inline-block">
              <Button variant="secondary">Voltar ao início</Button>
            </Link>
          </CardBody>
        </Card>
      </main>
    );
  }

  const hoje = new Date();
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000);

  const [visitasHoje, propostasAbertas, contratosAtivos] = await Promise.all([
    prisma.visita.findMany({
      where: { corretorId: corretor.id, dataHora: { gte: inicioDia, lt: fimDia } },
      include: { imovel: { select: { titulo: true, bairro: true, cidade: true } }, cliente: { select: { nome: true, telefone: true } } },
      orderBy: { dataHora: 'asc' },
    }),
    prisma.proposta.findMany({
      where: { corretorId: corretor.id, status: { in: ['em_analise', 'contraproposta'] } },
      include: { imovel: { select: { titulo: true } }, cliente: { select: { nome: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.contrato.count({ where: { corretorId: corretor.id, status: 'ativo' } }),
  ]);

  const comissoesPagas = corretor.comissoes.filter((c) => c.status === 'paga').reduce((s, c) => s + Number(c.valor), 0);
  const comissoesPendentes = corretor.comissoes.filter((c) => c.status === 'pendente' || c.status === 'aprovada').reduce((s, c) => s + Number(c.valor), 0);
  const meta = Number(corretor.metaMensal ?? 0);
  const progresso = meta > 0 ? Math.min(100, Math.round((comissoesPagas / meta) * 100)) : 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-fg-muted">App do Corretor</p>
          <h1 className="mt-1 text-3xl font-semibold text-fg">Olá, {corretor.nome.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-fg-muted">CRECI {corretor.creci ?? '—'} · {contratosAtivos} contratos ativos</p>
        </div>
        <Link href="/visitas">
          <Button variant="primary">Agendar visita</Button>
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-fg-muted"><Wallet className="h-4 w-4" /><span className="text-xs uppercase">Comissões pagas</span></div>
            <p className="mt-2 text-2xl font-semibold text-fg">{fmt(comissoesPagas)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-fg-muted"><TrendingUp className="h-4 w-4" /><span className="text-xs uppercase">A receber</span></div>
            <p className="mt-2 text-2xl font-semibold text-fg">{fmt(comissoesPendentes)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-fg-muted"><Calendar className="h-4 w-4" /><span className="text-xs uppercase">Visitas hoje</span></div>
            <p className="mt-2 text-2xl font-semibold text-fg">{visitasHoje.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-fg-muted"><FileText className="h-4 w-4" /><span className="text-xs uppercase">Propostas abertas</span></div>
            <p className="mt-2 text-2xl font-semibold text-fg">{propostasAbertas.length}</p>
          </CardBody>
        </Card>
      </section>

      {meta > 0 && (
        <Card className="mt-6">
          <CardBody>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-fg">Meta mensal</span>
              <span className="text-fg-muted">{fmt(comissoesPagas)} / {fmt(meta)} · {progresso}%</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface/60">
              <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${progresso}%` }} />
            </div>
          </CardBody>
        </Card>
      )}

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <CardTitle>Agenda de hoje</CardTitle>
              <Link href="/visitas" className="text-xs text-brand hover:underline">Ver tudo</Link>
            </div>
            {visitasHoje.length === 0 ? (
              <p className="mt-4 text-sm text-fg-muted">Nenhuma visita agendada para hoje. Aproveite para prospectar novos leads.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {visitasHoje.map((v) => (
                  <li key={v.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-fg">{v.imovel.titulo}</p>
                      <p className="text-xs text-fg-muted">{v.cliente.nome} · {v.cliente.telefone}</p>
                    </div>
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                      {new Date(v.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <CardTitle>Propostas em aberto</CardTitle>
              <Link href="/propostas" className="text-xs text-brand hover:underline">Ver tudo</Link>
            </div>
            {propostasAbertas.length === 0 ? (
              <p className="mt-4 text-sm text-fg-muted">Sem propostas aguardando resposta. Continue trabalhando os leads.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {propostasAbertas.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-fg">{p.imovel.titulo}</p>
                      <p className="text-xs text-fg-muted">{p.cliente.nome} · {p.tipo}</p>
                    </div>
                    <span className="text-sm font-semibold text-fg">{fmt(p.valor)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>

      <section className="mt-8">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <CardTitle>Minha carteira</CardTitle>
              <Link href="/imoveis" className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {corretor.imoveisCarteira.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center">
                <Building2 className="mx-auto h-6 w-6 text-fg-muted" />
                <p className="mt-2 text-sm text-fg-muted">Nenhum imóvel atribuído à sua carteira ainda.</p>
                <Link href="/imoveis" className="mt-3 inline-block">
                  <Button variant="secondary" size="sm">Explorar imóveis</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {corretor.imoveisCarteira.map((i) => (
                  <Link key={i.id} href={`/imoveis/${i.id}`} className="rounded-lg border border-border bg-surface/70 p-4 backdrop-blur-sm transition-all duration-150 hover:bg-white/5">
                    <p className="text-xs uppercase tracking-wider text-fg-muted">{i.codigo}</p>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-fg">{i.titulo}</p>
                    <p className="mt-1 text-xs text-fg-muted">{i.bairro ?? '—'} · {i.cidade ?? '—'}</p>
                    <p className="mt-2 text-sm font-semibold text-brand">
                      {i.finalidade === 'venda' ? fmt(i.valorVenda) : fmt(i.valorAluguel)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
