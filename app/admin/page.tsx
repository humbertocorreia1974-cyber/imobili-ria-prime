import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Users, Percent, BellRing, ShieldCheck } from 'lucide-react';
import UsuariosTable from './usuarios-table-client';
import IndicesForm from './indices-form-client';
import ReguaForm from './regua-form-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Painel Admin | Imobiliária Prime',
  description: 'Gestão de usuários, papéis, índices de reajuste e régua de cobrança.',
  openGraph: { title: 'Painel Admin | Imobiliária Prime', description: 'Gestão de usuários, papéis e configurações.' },
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') redirect('/');

  const [usuarios, imobiliaria, logs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, name: true, email: true, role: true, plan: true, createdAt: true },
    }),
    prisma.imobiliaria.findFirst(),
    prisma.logAuditoria.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, acao: true, entidade: true, createdAt: true },
    }),
  ]);

  const regua = (imobiliaria?.reguaCobranca as any) ?? {
    d0: 'Lembrete amigável por e-mail',
    d1: 'Aviso de atraso + link de pagamento',
    d5: 'Cobrança formal + WhatsApp',
    d10: 'Notificação ao proprietário',
    d30: 'Encaminhamento jurídico',
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-fg">Painel Admin</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Controle de acesso, índices de reajuste e régua de cobrança da operação.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-fg-muted backdrop-blur-sm">
          <ShieldCheck className="h-3.5 w-3.5 text-brand" /> {session.user.email}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" />
              <CardTitle>Usuários e papéis</CardTitle>
            </div>
            <UsuariosTable usuarios={usuarios.map(u => ({ ...u, createdAt: u.createdAt.toISOString() }))} />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="mb-4 flex items-center gap-2">
              <Percent className="h-4 w-4 text-brand" />
              <CardTitle>Índices de reajuste</CardTitle>
            </div>
            <IndicesForm indicePadrao={imobiliaria?.indiceReajustePadrao ?? 'IGP-M'} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <div className="mb-4 flex items-center gap-2">
              <BellRing className="h-4 w-4 text-brand" />
              <CardTitle>Régua de cobrança</CardTitle>
            </div>
            <ReguaForm regua={regua} />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle className="mb-4">Auditoria recente</CardTitle>
            {logs.length === 0 ? (
              <p className="text-sm text-fg-muted">Nenhum log registrado ainda.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {logs.map(l => (
                  <li key={l.id} className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
                    <div>
                      <p className="text-fg">{l.acao}</p>
                      <p className="text-xs text-fg-muted">{l.entidade}</p>
                    </div>
                    <span className="text-xs text-fg-muted">
                      {new Date(l.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
