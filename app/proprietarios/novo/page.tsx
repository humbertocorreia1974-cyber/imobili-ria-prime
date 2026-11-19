import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ProprietarioForm } from './proprietario-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Novo Proprietário | Imobiliária Prime',
  description: 'Cadastro de proprietário com dados bancários e PIX.',
};

export default async function NovoProprietarioPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (!['admin', 'corretor'].includes(session.user.role ?? '')) redirect('/');

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-fg-muted">CRM</p>
          <h1 className="mt-1 text-3xl font-semibold text-fg">Novo proprietário</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Dados cadastrais, contato e informações bancárias para repasses.
          </p>
        </header>
        <ProprietarioForm />
      </div>
    </div>
  );
}
