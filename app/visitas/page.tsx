import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Plus, MapPin, User as UserIcon } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import VisitaAcoes from "./visita-acoes-client";
import NovaVisitaForm from "./nova-visita-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agenda de Visitas | Imobiliária Prime",
  description: "Calendário de visitas com corretor responsável, confirmação e histórico por imóvel.",
  openGraph: { title: "Agenda de Visitas — Imobiliária Prime", description: "Agende, confirme e acompanhe visitas sem overbooking." },
};

const STATUS_STYLE: Record<string, string> = {
  agendada: "bg-brand/10 text-brand",
  confirmada: "bg-emerald-500/10 text-emerald-500",
  realizada: "bg-emerald-500/15 text-emerald-600",
  cancelada: "bg-red-500/10 text-red-500",
  no_show: "bg-amber-500/10 text-amber-600",
};

function fmt(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

export default async function VisitasPage({ searchParams }: { searchParams: { status?: string; corretorId?: string; data?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const where: any = {};
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.corretorId) where.corretorId = searchParams.corretorId;
  if (searchParams.data) {
    const d = new Date(searchParams.data);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.dataHora = { gte: d, lt: next };
  }

  const [visitas, corretores, imoveis, clientes] = await Promise.all([
    prisma.visita.findMany({
      where,
      orderBy: { dataHora: "asc" },
      take: 100,
      include: {
        imovel: { select: { id: true, titulo: true, codigo: true, bairro: true, cidade: true } },
        corretor: { select: { id: true, nome: true } },
        cliente: { select: { id: true, nome: true, telefone: true } },
      },
    }),
    prisma.corretor.findMany({ where: { ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.imovel.findMany({ where: { situacao: "disponivel" }, select: { id: true, titulo: true, codigo: true }, orderBy: { titulo: "asc" }, take: 200 }),
    prisma.cliente.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" }, take: 200 }),
  ]);

  const hoje = new Date();
  const proximas = visitas.filter((v) => v.dataHora >= hoje && v.status !== "cancelada");
  const passadas = visitas.filter((v) => v.dataHora < hoje || v.status === "cancelada");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Agenda de Visitas</h1>
          <p className="text-sm text-fg-muted">{proximas.length} agendadas · {passadas.length} no histórico</p>
        </div>
        <NovaVisitaForm corretores={corretores} imoveis={imoveis} clientes={clientes} />
      </header>

      <Card className="mb-6">
        <CardBody>
          <form className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-fg-muted">
              Data
              <input type="date" name="data" defaultValue={searchParams.data} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-fg-muted">
              Status
              <select name="status" defaultValue={searchParams.status ?? ""} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
                <option value="">Todos</option>
                <option value="agendada">Agendada</option>
                <option value="confirmada">Confirmada</option>
                <option value="realizada">Realizada</option>
                <option value="cancelada">Cancelada</option>
                <option value="no_show">No-show</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-fg-muted">
              Corretor
              <select name="corretorId" defaultValue={searchParams.corretorId ?? ""} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
                <option value="">Todos</option>
                {corretores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
            <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
            <Link href="/visitas" className="text-xs text-fg-muted underline-offset-4 hover:underline">Limpar</Link>
          </form>
        </CardBody>
      </Card>

      {visitas.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <CalendarDays className="h-8 w-8 text-fg-muted" />
            <p className="text-sm text-fg-muted">Nenhuma visita encontrada com esses filtros.</p>
            <p className="text-xs text-fg-muted">Use o botão <strong>Nova visita</strong> para agendar a primeira.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-fg-muted">Próximas</h2>
            <div className="space-y-3">
              {proximas.length === 0 && <p className="text-sm text-fg-muted">Sem visitas futuras.</p>}
              {proximas.map((v) => (
                <Card key={v.id}>
                  <CardBody className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-[220px] flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[v.status] ?? "bg-surface text-fg-muted"}`}>{v.status}</span>
                        <span className="text-xs text-fg-muted">{fmt(v.dataHora)} · {v.duracaoMin}min</span>
                      </div>
                      <p className="mt-1 font-medium text-fg">{v.imovel.titulo}</p>
                      <p className="flex items-center gap-1 text-xs text-fg-muted"><MapPin className="h-3 w-3" />{v.imovel.bairro ?? "—"}, {v.imovel.cidade ?? "—"} · cód. {v.imovel.codigo}</p>
                    </div>
                    <div className="text-sm text-fg-muted">
                      <p className="flex items-center gap-1"><UserIcon className="h-3 w-3" />{v.cliente.nome} · {v.cliente.telefone}</p>
                      <p className="text-xs">Corretor: {v.corretor.nome}</p>
                    </div>
                    <VisitaAcoes id={v.id} status={v.status} />
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>

          {passadas.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-fg-muted">Histórico</h2>
              <Card>
                <CardBody className="p-0">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border text-left text-xs uppercase text-fg-muted">
                      <tr>
                        <th className="px-4 py-2">Data</th>
                        <th className="px-4 py-2">Imóvel</th>
                        <th className="px-4 py-2">Cliente</th>
                        <th className="px-4 py-2">Corretor</th>
                        <th className="px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passadas.map((v) => (
                        <tr key={v.id} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-2 text-fg-muted">{fmt(v.dataHora)}</td>
                          <td className="px-4 py-2 text-fg">{v.imovel.titulo}</td>
                          <td className="px-4 py-2 text-fg-muted">{v.cliente.nome}</td>
                          <td className="px-4 py-2 text-fg-muted">{v.corretor.nome}</td>
                          <td className="px-4 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[v.status] ?? "bg-surface text-fg-muted"}`}>
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            </section>
          )}
        </div>
      )}
    </div>
  );
}