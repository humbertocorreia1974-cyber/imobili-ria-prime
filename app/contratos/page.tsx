import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSignature, Plus, AlertTriangle } from 'lucide-react';
import ContratoAcoesClient from './contrato-acoes-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contratos | Imobiliária Prime',
  description: 'Contratos de locação com reajuste anual e venda com comissão — assinatura, vencimentos e histórico.',
  openGraph: { title: 'Contratos | Imobiliária Prime', description: 'Gestão contratual completa.' },
};

const fmt = (v: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v ?? 0));
const fmtDate = (d: Date | null | undefined) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');

export default async function ContratosPage({ searchParams }: { searchParams: { tipo?: string; status?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const where: any = {};
  if (searchParams.tipo) where.tipo = searchParams.tipo;
  if (searchParams.status) where.status = searchParams.status;

  const contratos = await prisma.contrato.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      imovel: { select: { codigo: true, titulo: true } },
      inquilino: { select: { nome: true } },
      comprador: { select: { nome: true } },
      corretor: { select: { nome: true } },
      _count: { select: { parcelas: true, vistorias: true } },
    },
  });

  const hoje = new Date();
  const em30 = new Date(hoje.getTime() + 30 * 86400000);
  const vencendo = contratos.filter(
    (c) => c.status === 'ativo' && c.dataFim && new Date(c.dataFim) <= em30 && new Date(c.dataFim) >= hoje,
  );
  const reajustesProximos = contratos.filter(
    (c) => c.status === 'ativo' && c.proximoReajusteEm && new Date(c.proximoReajusteEm) <= em30,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Contratos</h1>
          <p className="text-sm text-fg-muted">Locação com reajuste anual · Venda com comissão</p>
        </div>
        <Link href="/propostas">
          <Button variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" /> Novo contrato via proposta
          </Button>
        </Link>
      </header>

      {(vencendo.length > 0 || reajustesProximos.length > 0) && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {vencendo.length > 0 && (
            <Card className="border-accent/40 bg-accent/5">
              <CardBody className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium text-fg">{vencendo.length} contrato(s) vencendo em 30 dias</p>
                  <p className="text-xs text-fg-muted">Revise renovação ou encerramento.</p>
                </div>
              </CardBody>
            </Card>
          )}
          {reajustesProximos.length > 0 && (
            <Card className="border-brand/40 bg-brand/5">
              <CardBody className="flex items-start gap-3">
                <FileSignature className="mt-0.5 h-5 w-5 text-brand" />
                <div>
                  <p className="text-sm font-medium text-fg">{reajustesProximos.length} reajuste(s) programado(s)</p>
                  <p className="text-xs text-fg-muted">Aplique IGP-M/IPCA no prazo.</p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      <Card className="mb-4">
        <CardBody>
          <form className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-xs text-fg-muted">
              Tipo
              <select name="tipo" defaultValue={searchParams.tipo ?? ''} className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
                <option value="">Todos</option>
                <option value="locacao">Locação</option>
                <option value="venda">Venda</option>
              </select>
            </label>
            <label className="flex flex-col text-xs text-fg-muted">
              Status
              <select name="status" defaultValue={searchParams.status ?? ''} className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
                <option value="">Todos</option>
                <option value="rascunho">Rascunho</option>
                <option value="ativo">Ativo</option>
                <option value="encerrado">Encerrado</option>
                <option value="rescindido">Rescindido</option>
                <option value="inadimplente">Inadimplente</option>
              </select>
            </label>
            <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
          </form>
        </CardBody>
      </Card>

      {contratos.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <FileSignature className="mx-auto mb-3 h-10 w-10 text-fg-muted" />
            <p className="text-sm text-fg">Nenhum contrato encontrado.</p>
            <p className="mb-4 text-xs text-fg-muted">Converta uma proposta aprovada em contrato para começar.</p>
            <Link href="/propostas"><Button variant="primary" size="sm">Ir para Propostas</Button></Link>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase text-fg-muted">
                <tr>
                  <th className="px-4 py-3">Nº / Tipo</th>
                  <th className="px-4 py-3">Imóvel</th>
                  <th className="px-4 py-3">Parte</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Vigência</th>
                  <th className="px-4 py-3">Reajuste</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contratos.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 transition-colors hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-medium text-fg">{c.numero}</div>
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">{c.tipo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-fg">{c.imovel.codigo}</div>
                      <div className="text-xs text-fg-muted">{c.imovel.titulo}</div>
                    </td>
                    <td className="px-4 py-3 text-fg-muted">
                      {c.inquilino?.nome ?? c.comprador?.nome ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-fg">
                      {c.tipo === 'locacao' ? `${fmt(c.valorMensal)}/mês` : fmt(c.valorTotal)}
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted">
                      {fmtDate(c.dataInicio)} → {fmtDate(c.dataFim)}
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted">
                      {c.indiceReajuste} · {fmtDate(c.proximoReajusteEm)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        c.status === 'ativo' ? 'bg-brand/10 text-brand'
                        : c.status === 'inadimplente' ? 'bg-red-500/10 text-red-400'
                        : 'bg-fg-muted/10 text-fg-muted'
                      }`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ContratoAcoesClient
                        contratoId={c.id}
                        tipo={c.tipo}
                        status={c.status}
                        indiceReajuste={c.indiceReajuste}
                        valorAtual={Number(c.valorMensal ?? c.valorTotal ?? 0)}
                      />
                    </td>
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
