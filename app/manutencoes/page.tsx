import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ManutencaoForm } from './manutencao-form';
import { ManutencaoAcoes } from './manutencao-acoes';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Manutenções | Imobiliária Prime',
  description: 'Abertura pelo inquilino, orçamento e aprovação do proprietário em um fluxo único.',
  openGraph: { title: 'Manutenções | Imobiliária Prime', description: 'Fluxo de manutenção com orçamento e aprovação.' },
};

const STATUS_LABEL: Record<string, string> = {
  aberta: 'Aberta',
  orcamento: 'Em orçamento',
  aguardando_aprovacao: 'Aguardando aprovação',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  em_execucao: 'Em execução',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const URGENCIA_COR: Record<string, string> = {
  baixa: 'bg-fg-muted/10 text-fg-muted',
  normal: 'bg-brand/10 text-brand',
  alta: 'bg-accent/15 text-accent',
  urgente: 'bg-red-500/15 text-red-400',
};

export default async function ManutencoesPage({ searchParams }: { searchParams: { status?: string; imovelId?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const role = session.user.role;
  const where: any = {};
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.imovelId) where.imovelId = searchParams.imovelId;

  // Inquilino só vê as que ele abriu; proprietário só vê as dos imóveis dele.
  if (role === 'inquilino') where.solicitanteId = session.user.id;
  if (role === 'proprietario') {
    const prop = await prisma.proprietario.findUnique({ where: { userId: session.user.id } });
    where.proprietarioId = prop?.id ?? '__none__';
  }

  const [manutencoes, imoveis] = await Promise.all([
    prisma.manutencao.findMany({
      where,
      orderBy: [{ urgencia: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      include: {
        imovel: { select: { id: true, codigo: true, titulo: true } },
        solicitante: { select: { name: true } },
        proprietario: { select: { nome: true } },
      },
    }),
    prisma.imovel.findMany({
      where: role === 'inquilino'
        ? { contratos: { some: { userIdInquilino: session.user.id, status: 'ativo' } } }
        : role === 'proprietario'
          ? { proprietario: { userId: session.user.id } }
          : {},
      select: { id: true, codigo: true, titulo: true },
      orderBy: { codigo: 'asc' },
      take: 200,
    }),
  ]);

  const podeAbrir = role === 'inquilino' || role === 'admin' || role === 'corretor';

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Manutenções</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Abertura pelo inquilino, orçamento do prestador e aprovação do proprietário — tudo rastreável.
          </p>
        </div>
        {podeAbrir && <ManutencaoForm imoveis={imoveis} />}
      </header>

      <form className="mb-6 flex flex-wrap items-center gap-3" action="/manutencoes">
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
          name="imovelId"
          defaultValue={searchParams.imovelId ?? ''}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
        >
          <option value="">Todos os imóveis</option>
          {imoveis.map((i) => (
            <option key={i.id} value={i.id}>{i.codigo} — {i.titulo}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
      </form>

      {manutencoes.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <p className="text-fg-muted">Nenhuma manutenção encontrada com esses filtros.</p>
            {podeAbrir && <p className="mt-2 text-sm text-fg-muted">Abra a primeira pelo botão acima.</p>}
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {manutencoes.map((m) => (
            <Card key={m.id}>
              <CardBody className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${URGENCIA_COR[m.urgencia] ?? URGENCIA_COR.normal}`}>
                      {m.urgencia}
                    </span>
                    <span className="rounded-full bg-fg-muted/10 px-2 py-0.5 text-xs text-fg-muted">
                      {STATUS_LABEL[m.status] ?? m.status}
                    </span>
                    <span className="text-xs text-fg-muted">{m.categoria ?? 'geral'}</span>
                  </div>
                  <h3 className="mt-2 truncate font-medium text-fg">{m.titulo}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{m.descricao}</p>
                  <p className="mt-2 text-xs text-fg-muted">
                    <Link href={`/imoveis/${m.imovel.id}`} className="text-brand hover:underline">
                      {m.imovel.codigo} — {m.imovel.titulo}
                    </Link>
                    {' · '}solicitante {m.solicitante?.name ?? '—'}
                    {m.proprietario && <> · dono {m.proprietario.nome}</>}
                    {m.valorOrcamento != null && <> · orçamento R$ {Number(m.valorOrcamento).toFixed(2)}</>}
                  </p>
                </div>
                <ManutencaoAcoes
                  id={m.id}
                  status={m.status}
                  role={role}
                  valorOrcamento={m.valorOrcamento ? Number(m.valorOrcamento) : null}
                />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
