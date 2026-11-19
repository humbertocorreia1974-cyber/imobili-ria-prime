import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ClienteForm } from './cliente-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Novo Cliente | Imobiliária Prime',
  description: 'Cadastro de lead com interesse, faixa de preço e origem.',
};

export default async function NovoClientePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (!['admin', 'corretor'].includes(session.user.role ?? '')) redirect('/');

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-fg-muted">CRM</p>
          <h1 className="mt-1 text-3xl font-semibold text-fg">Novo cliente / interessado</h1>
          <p className="mt-1 text-sm text-fg-muted">
            O score inicial é calculado automaticamente com base na completude do cadastro.
          </p>
        </header>
        <ClienteForm />
      </div>
    </div>
  );
}
