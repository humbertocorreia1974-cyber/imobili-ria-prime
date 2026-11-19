import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardTitle, CardBody } from '@/components/ui/card';
import { Building2, Percent, Plug } from 'lucide-react';
import DadosForm from './dados-form-client';
import GatewayForm from './gateway-form-client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Configurações | Imobiliária Prime',
  description: 'Dados da imobiliária, taxa de administração e integrações de gateway.',
  openGraph: { title: 'Configurações | Imobiliária Prime', description: 'Configurações da imobiliária.' },
};

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') redirect('/');

  const imob = await prisma.imobiliaria.findFirst();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-fg">Configurações da Imobiliária</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Dados institucionais, taxa de administração e integrações com gateway de pagamento, assinatura e WhatsApp.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand" />
              <CardTitle>Dados e taxa</CardTitle>
            </div>
            <DadosForm
              inicial={{
                nome: imob?.nome ?? '',
                cnpj: imob?.cnpj ?? '',
                email: imob?.email ?? '',
                telefone: imob?.telefone ?? '',
                endereco: imob?.endereco ?? '',
                taxaAdministracaoPct: imob ? Number(imob.taxaAdministracaoPct) : 8,
                diaRepasse: imob?.diaRepasse ?? 10,
              }}
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="mb-4 flex items-center gap-2">
              <Plug className="h-4 w-4 text-brand" />
              <CardTitle>Gateway e integrações</CardTitle>
            </div>
            <GatewayForm
              inicial={{
                gatewayProvider: imob?.gatewayProvider ?? 'asaas',
                gatewayApiKey: imob?.gatewayApiKey ?? '',
                clicksignEnabled: imob?.clicksignEnabled ?? false,
                clicksignToken: imob?.clicksignToken ?? '',
                whatsappEnabled: imob?.whatsappEnabled ?? false,
                whatsappPhoneId: imob?.whatsappPhoneId ?? '',
                whatsappToken: imob?.whatsappToken ?? '',
              }}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <div className="mb-2 flex items-center gap-2">
              <Percent className="h-4 w-4 text-brand" />
              <CardTitle>Como a taxa de administração é aplicada</CardTitle>
            </div>
            <p className="text-sm text-fg-muted">
              O repasse ao proprietário é calculado como <strong className="text-fg">valor bruto da parcela − taxa de administração</strong>.
              A taxa padrão é de {imob ? Number(imob.taxaAdministracaoPct).toFixed(2) : '8.00'}% e o repasse é processado todo dia {imob?.diaRepasse ?? 10}.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
