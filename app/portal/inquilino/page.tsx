import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Wrench, QrCode, Download } from 'lucide-react';
import AbrirManutencaoForm from './abrir-manutencao-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Portal do Inquilino | Imobiliária Prime',
  description: 'Segunda via de boleto, PIX, contrato e abertura de manutenção.',
};

const fmt = (v: number | string | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v ?? 0));

export default async function PortalInquilinoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const cliente = await prisma.cliente.findUnique({ where: { userId: session.user.id } });
  if (!cliente) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Card>
          <CardBody>
            <h1 className="text-xl font-semibold text-fg">Cadastro não encontrado</h1>
            <p className="mt-2 text-sm text-fg-muted">Sua conta ainda não está vinculada a um inquilino. Fale com a imobiliária.</p>
          </CardBody>
        </Card>
      </main>
    );
  }

  const contratos = await prisma.contrato.findMany({
    where: { inquilinoId: cliente.id, status: 'ativo' },
    include: {
      imovel: { select: { titulo: true, logradouro: true, numero: true, bairro: true, cidade: true } },
      parcelas: {
        orderBy: { dataVencimento: 'desc' },
        take: 12,
        include: { boletos: { orderBy: { createdAt: 'desc' }, take: 1 } },
      },
    },
  });

  const manutencoes = await prisma.manutencao.findMany({
    where: { solicitanteId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { imovel: { select: { titulo: true } } },
  });

  const contratoAtivo = contratos[0];
  const parcelas = contratoAtivo?.parcelas ?? [];
  const proximaParcela = parcelas.find((p) => p.status === 'pendente' || p.status === 'atrasado');
  const boletoAtual = proximaParcela?.boletos[0];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wider text-fg-muted">Portal do Inquilino</p>
        <h1 className="mt-1 text-3xl font-semibold text-fg">Olá, {cliente.nome.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-fg-muted">Gerencie boletos, contrato e solicitações de manutenção.</p>
      </header>

      {!contratoAtivo ? (
        <Card>
          <CardBody>
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-fg-muted" />
              <p className="mt-3 text-sm text-fg-muted">Nenhum contrato ativo encontrado.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardBody>
                <CardTitle>Próximo vencimento</CardTitle>
                {!proximaParcela ? (
                  <p className="mt-4 text-sm text-fg-muted">Nenhuma parcela em aberto. Tudo em dia!</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-3xl font-semibold text-fg">{fmt(proximaParcela.valorTotal)}</p>
                        <p className="mt-1 text-sm text-fg-muted">
                          Vence em {new Date(proximaParcela.dataVencimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs ${proximaParcela.status === 'atrasado' ? 'bg-red-500/10 text-red-500' : 'bg-brand/10 text-brand'}`}>
                        {proximaParcela.status}
                      </span>
                    </div>

                    {boletoAtual?.pixCopiaCola && (
                      <div className="rounded-lg border border-border bg-surface/70 p-4 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-fg-muted">
                          <QrCode className="h-4 w-4" />
                          <span className="text-xs uppercase tracking-wider">PIX copia e cola</span>
                        </div>
                        <code className="mt-2 block break-all rounded bg-bg/60 p-2 text-xs text-fg">
                          {boletoAtual.pixCopiaCola}
                        </code>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {boletoAtual?.linkPagamento && (
                        <a href={boletoAtual.linkPagamento} target="_blank" rel="noreferrer">
                          <Button variant="primary">Pagar agora</Button>
                        </a>
                      )}
                      {boletoAtual?.urlPdf && (
                        <a href={boletoAtual.urlPdf} target="_blank" rel="noreferrer">
                          <Button variant="secondary">
                            <Download className="mr-2 h-4 w-4" /> Baixar boleto
                          </Button>
                        </a>
                      )}
                      {!boletoAtual && (
                        <form action={`/api/boletos/${proximaParcela.id}/2via`} method="POST">
                          <Button variant="primary" type="submit">Gerar 2ª via</Button>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <CardTitle>Histórico de parcelas</CardTitle>
                {parcelas.length === 0 ? (
                  <p className="mt-4 text-sm text-fg-muted">Sem parcelas registradas.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-muted">
                          <th className="pb-2 pr-4">Competência</th>
                          <th className="pb-2 pr-4">Vencimento</th>
                          <th className="pb-2 pr-4">Valor</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {parcelas.map((p) => (
                          <tr key={p.id}>
                            <td className="py-3 pr-4 text-fg">{p.competencia}</td>
                            <td className="py-3 pr-4 text-fg-muted">{new Date(p.dataVencimento).toLocaleDateString('pt-BR')}</td>
                            <td className="py-3 pr-4 font-medium text-fg">{fmt(p.valorTotal)}</td>
                            <td className="py-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs ${p.status === 'pago' ? 'bg-emerald-500/10 text-emerald-500' : p.status === 'atrasado' ? 'bg-red-500/10 text-red-500' : 'bg-brand/10 text-brand'}`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardBody>
                <CardTitle>Contrato ativo</CardTitle>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="font-medium text-fg">{contratoAtivo.imovel.titulo}</p>
                  <p className="text-fg-muted">
                    {contratoAtivo.imovel.logradouro}, {contratoAtivo.imovel.numero} — {contratoAtivo.imovel.bairro}
                  </p>
                  <p className="text-fg-muted">Contrato nº {contratoAtivo.numero}</p>
                  <p className="text-fg-muted">
                    Vigência: {new Date(contratoAtivo.dataInicio).toLocaleDateString('pt-BR')}
                    {contratoAtivo.dataFim ? ` até ${new Date(contratoAtivo.dataFim).toLocaleDateString('pt-BR')}` : ''}
                  </p>
                  <p className="text-fg-muted">Aluguel: {fmt(contratoAtivo.valorMensal)}</p>
                </div>
                {contratoAtivo.pdfUrl && (
                  <a href={contratoAtivo.pdfUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block">
                    <Button variant="secondary" size="sm">
                      <Download className="mr-2 h-4 w-4" /> Baixar contrato
                    </Button>
                  </a>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <CardTitle>Abrir manutenção</CardTitle>
                <p className="mt-2 text-xs text-fg-muted">Descreva o problema e a imobiliária aciona o prestador.</p>
                <AbrirManutencaoForm imovelId={contratoAtivo.imovelId} />
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <CardTitle>Minhas solicitações</CardTitle>
                {manutencoes.length === 0 ? (
                  <p className="mt-4 text-sm text-fg-muted">Nenhuma solicitação registrada.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {manutencoes.map((m) => (
                      <li key={m.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-fg">{m.titulo}</p>
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">{m.status}</span>
                        </div>
                        <p className="mt-1 text-xs text-fg-muted">{m.imovel.titulo}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
