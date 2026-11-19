'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function ProprietarioForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch('/api/proprietarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao cadastrar');
      router.push('/proprietarios');
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardBody>
          <CardTitle className="mb-4">Dados cadastrais</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-fg-muted">Nome completo *</label>
              <Input name="nome" required placeholder="Ex: Maria Silva" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-fg-muted">CPF ou CNPJ *</label>
              <Input name="cpfCnpj" required placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-fg-muted">Telefone *</label>
              <Input name="telefone" required placeholder="(11) 99999-9999" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-fg-muted">E-mail *</label>
              <Input name="email" type="email" required placeholder="maria@email.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-fg-muted">Endereço</label>
              <Input name="endereco" placeholder="Rua, número, cidade/UF" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <CardTitle className="mb-4">Dados bancários (para repasses)</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-fg-muted">Banco</label>
              <Input name="banco" placeholder="Ex: Itaú" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-fg-muted">Agência</label>
              <Input name="agencia" placeholder="0000" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-fg-muted">Conta</label>
              <Input name="conta" placeholder="00000-0" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-fg-muted">Chave PIX</label>
              <Input name="pixChave" placeholder="CPF, e-mail, telefone ou aleatória" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-fg-muted">Observações</label>
              <textarea
                name="observacoes"
                rows={3}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-brand focus:outline-none"
                placeholder="Preferências, condições especiais..."
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {erro && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {erro}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" size="md" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="md" disabled={loading}>
          {loading ? 'Salvando...' : 'Cadastrar proprietário'}
        </Button>
      </div>
    </form>
  );
}
