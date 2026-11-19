import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Bed, Bath, Car, Ruler, Building2, User as UserIcon, Calendar, FileText, Handshake } from 'lucide-react';
import GaleriaImovel from './galeria-imovel';
import SituacaoImovel from './situacao-imovel';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const im = await prisma.imovel.findUnique({ where: { id: params.id }, select: { titulo: true, descricao: true, bairro: true, cidade: true } });
  if (!im) return { title: 'Imóvel não encontrado' };
  return {
    title: `${im.titulo} — Imobiliária Prime`,
    description: im.descricao?.slice(0, 160) ?? `${im.titulo} em ${im.bairro ?? ''} ${im.cidade ?? ''}`.trim(),
    openGraph: { title: im.titulo, description: im.descricao ?? undefined },
  };
}

const fmt = (v: any) => (v == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)));

export default async function Page({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return notFound();

  const imovel = await prisma.imovel.findUnique({
    where: { id: params.id },
    include: {
      proprietario: true,
      corretor: true,
      midias: { orderBy: { ordem: 'asc' } },
      caracteristicas: { include: { feature: true } },
      visitas: { orderBy: { dataHora: 'desc' }, take: 10, include: { cliente: true, corretor: true } },
      propostas: { orderBy: { createdAt: 'desc' }, take: 10, include: { cliente: true } },
      contratos: { where: { status: 'ativo' }, take: 1, include: { inquilino: true, comprador: true } },
    },
  });
  if (!imovel) return notFound();

  const contratoAtivo = imovel.contratos[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-fg-muted">Imóvel {imovel.codigo}</p>
          <h1 className="mt-1 text-2xl font-semibold text-fg">{imovel.titulo}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-fg-muted">
            <MapPin className="h-4 w-4" />
            {[imovel.logradouro, imovel.numero, imovel.bairro, imovel.cidade, imovel.estado].filter(Boolean).join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SituacaoImovel imovelId={imovel.id} situacao={imovel.situacao} />
          <Link href={`/imoveis/${imovel.id}/editar`}>
            <Button variant="secondary" size="sm">Editar</Button>
          </Link>
        </div>
      </div>

      <GaleriaImovel midias={imovel.midias} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardBody>
              <CardTitle>Características</CardTitle>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div className="flex items-center gap-2 text-fg"><Bed className="h-4 w-4 text-brand" /> {imovel.quartos ?? 0} quartos</div>
                <div className="flex items-center gap-2 text-fg"><Bath className="h-4 w-4 text-brand" /> {imovel.banheiros ?? 0} banheiros</div>
                <div className="flex items-center gap-2 text-fg"><Car className="h-4 w-4 text-brand" /> {imovel.vagas ?? 0} vagas</div>
                <div className="flex items-center gap-2 text-fg"><Ruler className="h-4 w-4 text-brand" /> {imovel.areaConstruida ?? imovel.areaTotal ?? 0} m²</div>
              </div>
              {imovel.caracteristicas.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {imovel.caracteristicas.map((c) => (
                    <span key={c.id} className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">{c.feature.nome}</span>
                  ))}
                </div>
              )}
              {imovel.descricao && <p className="mt-4 whitespace-pre-line text-sm text-fg-muted">{imovel.descricao}</p>}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <CardTitle>Histórico de visitas</CardTitle>
                <Link href={`/visitas/nova?imovelId=${imovel.id}`} className="text-xs font-medium text-brand hover:underline">Agendar visita</Link>
              </div>
              {imovel.visitas.length === 0 ? (
                <p className="mt-4 text-sm text-fg-muted">Nenhuma visita registrada. Agende a primeira para começar o funil.</p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {imovel.visitas.map((v) => (
                    <li key={v.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <p className="font-medium text-fg">{v.cliente.nome}</p>
                        <p className="text-xs text-fg-muted">Corretor: {v.corretor.nome} · {new Date(v.dataHora).toLocaleString('pt-BR')}</p>
                      </div>
                      <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-fg-muted">{v.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <CardTitle>Propostas</CardTitle>
                <Link href={`/propostas/nova?imovelId=${imovel.id}`} className="text-xs font-medium text-brand hover:underline">Nova proposta</Link>
              </div>
              {imovel.propostas.length === 0 ? (
                <p className="mt-4 text-sm text-fg-muted">Sem propostas ainda. Divulgue o imóvel na vitrine para captar interessados.</p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {imovel.propostas.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <p className="font-medium text-fg">{p.cliente.nome} · {fmt(p.valor)}</p>
                        <p className="text-xs text-fg-muted">{p.tipo === 'locacao' ? 'Locação' : 'Compra'} · {new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <Link href={`/propostas/${p.id}`} className="text-xs font-medium text-brand hover:underline">{p.status}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardBody>
              <CardTitle>Valores</CardTitle>
              <dl className="mt-4 space-y-3 text-sm">
                {imovel.valorAluguel && (
                  <div className="flex justify-between"><dt className="text-fg-muted">Aluguel</dt><dd className="font-semibold text-fg">{fmt(imovel.valorAluguel)}</dd></div>
                )}
                {imovel.valorVenda && (
                  <div className="flex justify-between"><dt className="text-fg-muted">Venda</dt><dd className="font-semibold text-fg">{fmt(imovel.valorVenda)}</dd></div>
                )}
                {imovel.valorCondominio && (
                  <div className="flex justify-between"><dt className="text-fg-muted">Condomínio</dt><dd className="text-fg">{fmt(imovel.valorCondominio)}</dd></div>
                )}
                {imovel.valorIptu && (
                  <div className="flex justify-between"><dt className="text-fg-muted">IPTU</dt><dd className="text-fg">{fmt(imovel.valorIptu)}</dd></div>
                )}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Vínculos</CardTitle>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <UserIcon className="mt-0.5 h-4 w-4 text-brand" />
                  <div>
                    <p className="text-xs text-fg-muted">Proprietário</p>
                    <Link href={`/proprietarios/${imovel.proprietarioId}`} className="font-medium text-fg hover:text-brand">{imovel.proprietario.nome}</Link>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Handshake className="mt-0.5 h-4 w-4 text-brand" />
                  <div>
                    <p className="text-xs text-fg-muted">Corretor responsável</p>
                    <p className="font-medium text-fg">{imovel.corretor?.nome ?? 'Não atribuído'}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Contrato ativo</CardTitle>
              {contratoAtivo ? (
                <div className="mt-4 space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-fg"><FileText className="h-4 w-4 text-brand" /> {contratoAtivo.numero}</p>
                  <p className="text-fg-muted">{contratoAtivo.tipo === 'locacao' ? 'Locação' : 'Venda'} · {contratoAtivo.inquilino?.nome ?? contratoAtivo.comprador?.nome}</p>
                  <p className="flex items-center gap-2 text-xs text-fg-muted"><Calendar className="h-3.5 w-3.5" /> Desde {new Date(contratoAtivo.dataInicio).toLocaleDateString('pt-BR')}</p>
                  <Link href={`/contratos/${contratoAtivo.id}`} className="mt-2 inline-block text-xs font-medium text-brand hover:underline">Ver contrato →</Link>
                </div>
              ) : (
                <p className="mt-4 text-sm text-fg-muted">Nenhum contrato ativo. Converta uma proposta aprovada para gerar o contrato.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CardTitle>Localização</CardTitle>
              <div className="mt-3 flex items-center gap-2 text-sm text-fg-muted">
                <Building2 className="h-4 w-4" />
                {imovel.cidade ?? '—'} / {imovel.estado ?? '—'}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
