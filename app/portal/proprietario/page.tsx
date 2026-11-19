import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ManutencaoAprovarClient } from './manutencao-aprovar-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Portal do Proprietário | Imobiliária Prime',
  description: 'Acompanhe repasses, contratos ativos e aprove manutenções dos seus imóveis.',
  openGraph: { title: 'Portal do Proprietário', description: 'Repasses, contratos e manutenções em um só lugar.' },
};

const brl = (v: number | string | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v ?? 0));

const fmtData = (d: Date | null | undefined) =>
  d ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d)) : '—';

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const proprietario = await prisma.proprietario.findUnique({
    where: { userId: session.user.id },
    include: {
      imoveis: { select: { id: true, codigo: true, titulo: true, situacao: true, valorAluguel: true, valorVenda: true, bairro: true, cidade: true } },
      repasses: { orderBy: { competencia: 'desc' }, take: 12 },
      manutencoesAprovadas: {
        where: { status: { in: ['aguardando_aprovacao', 'orcamento'] } },
        orderBy: { createdAt: 'desc' },
        include: { imovel: { select: { codigo: true, titulo: true } } },
      },
    },
  });

  if (!proprietario) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Card>
          <CardBody>
            <h1 className="text-xl font-semibold text-fg">Conta de proprietário não encontrada</h1>
            <p className="mt-2 text-sm text-fg-muted">
              Sua conta ainda não está vinculada a um cadastro de proprietário. Fale com o administrador da imobiliária.
            </p>
          </CardBody>
        </Card>
      </main>
    );
  }

  const contratos = await prisma.contrato.findMany({
    where: { imovel: { proprietarioId: proprietario.id }, status: 'ativo' },
    include: { imovel: { select: { codigo: true, titulo: true } } },
    orderBy: { dataInicio: 'desc' },
  });

  const totalRepassado = proprietario.repasses.filter((r) => r.status === 'pago').reduce((a, r) => a + Number(r.valorLiquido), 0);
  const totalPendente = proprietario.repasses.filter((r) => r.status !== 'pago').reduce((a, r) => a + Number(r.valorLiquido), 0);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-fg-muted">Portal do Proprietário</p>
          <h1 className="mt-1 text-3xl font-semibold text-fg">Olá, {proprietario.nome.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {proprietario.imoveis.length} imóvel(is) sob administração · PIX {proprietario.pixChave ?? 'não cadastrado'}
          </p>
        </div>
        <a href={`/api/repasses/extrato/${proprietario.id}`} target="_blank" rel="noreferrer">
          <Button variant="secondary">Extrato PDF</Button>
        </a>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-widest text-fg-muted">Repassado (12m)</p>
            <p className="mt-2 text-2xl font-semibold text-brand">{brl(totalRepassado)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-widest text-fg-muted">A receber</p>
            <p className="mt-2 text-2xl font-semibold text-accent">{brl(totalPendente)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-widest text-fg-muted">Contratos ativos</p>
            <p className="mt-2 text-2xl font-semibold text-fg">{contratos.length}</p>
          </CardBody>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-fg">Manutenções aguardando sua aprovação</h2>
        {proprietario.manutencoesAprovadas.length === 0 ? (
          <Card className="mt-3">
            <CardBody>
              <p className="text-sm text-fg-muted">Nenhuma manutenção pendente. Você será notificado por e-mail quando houver.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="mt-3 space-y-3">
            {proprietario.manutencoesAprovadas.map((m) => (
              <Card key={m.id}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-fg">{m.titulo}</p>
                      <p className="text-xs text-fg-muted">
                        {m.imovel.codigo} · {m.imovel.titulo} · urgência {m.urgencia}
                      </p>
                      <p className="mt-2 max-w-2xl text-sm text-fg-muted">{m.descricao}</p>
                      {m.valorOrcamento != null && (
                        <p className="mt-2 text-sm text-fg">
                          Orçamento: <span className="font-semibold text-brand">{brl(m.valorOrcamento)}</span>
                        </p>
                      )}
                    </div>
                    <ManutencaoAprovarClient manutencaoId={m.id} />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-fg">Meus imóveis</h2>
          <Card className="mt-3">
            <CardBody className="p-0">
              {proprietario.imoveis.length === 0 ? (
                <p className="p-6 text-sm text-fg-muted">Nenhum imóvel vinculado.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-muted">
                    <tr>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Imóvel</th>
                      <th className="px-4 py-3">Situação</th>
                      <th className="px-4 py-3 text-right">Aluguel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proprietario.imoveis.map((i) => (
                      <tr key={i.id} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs text-fg-muted">{i.codigo}</td>
                        <td className="px-4 py-3 text-fg">
                          {i.titulo}
                          <span className="block text-xs text-fg-muted">{i.bairro ?? '`} {i.cidade ? `· ${i.cidade}` : `'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">{i.situacao}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-fg">{brl(i.valorAluguel)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-fg">Últimos repasses</h2>
          <Card className="mt-3">
            <CardBody className="p-0">
              {proprietario.repasses.length === 0 ? (
                <p className="p-6 text-sm text-fg-muted">Nenhum repasse registrado ainda.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-muted">
                    <tr>
                      <th className="px-4 py-3">Competência</th>
                      <th className="px-4 py-3 text-right">Bruto</th>
                      <th className="px-4 py-3 text-right">Taxa</th>
                      <th className="px-4 py-3 text-right">Líquido</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proprietario.repasses.map((r) => (
                      <tr key={r.id} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-3 text-fg">{r.competencia}</td>
                        <td className="px-4 py-3 text-right text-fg-muted">{brl(r.valorBruto)}</td>
                        <td className="px-4 py-3 text-right text-fg-muted">-{brl(r.valorTaxaAdmin)}</td>
                        <td className="px-4 py-3 text-right font-medium text-fg">{brl(r.valorLiquido)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === 'pago' ? 'bg-brand/10 text-brand' : 'bg-accent/10 text-accent'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-fg">Contratos ativos</h2>
        <Card className="mt-3">
          <CardBody className="p-0">
            {contratos.length === 0 ? (
              <p className="p-6 text-sm text-fg-muted">Nenhum contrato ativo no momento.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-muted">
                  <tr>
                    <th className="px-4 py-3">Número</th>
                    <th className="px-4 py-3">Imóvel</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Vigência</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.map((c) => (
                    <tr key={c.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-fg-muted">{c.numero}</td>
                      <td className="px-4 py-3 text-fg">{c.imovel.codigo} · {c.imovel.titulo}</td>
                      <td className="px-4 py-3 text-fg-muted">{c.tipo}</td>
                      <td className="px-4 py-3 text-fg-muted">{fmtData(c.dataInicio)} → {fmtData(c.dataFim)}</td>
                      <td className="px-4 py-3 text-right text-fg">{brl(c.valorMensal ?? c.valorTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </section>
    </main>
  );
}
