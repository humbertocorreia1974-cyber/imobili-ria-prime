'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = { id: string; status: string; role: string; valorOrcamento: number | null };

export function ManutencaoAcoes({ id, status, role, valorOrcamento }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [modo, setModo] = useState<null | 'orcamento' | 'rejeitar'>(null);

  async function call(path: string, body: any) {
    setBusy(true);
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) { setModo(null); router.refresh(); }
  }

  if (modo === 'orcamento') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          call(`/api/manutencoes/${id}/orcamento`, {
            valorOrcamento: Number(fd.get('valorOrcamento')),
            prestadorNome: fd.get('prestadorNome'),
            prestadorContato: fd.get('prestadorContato'),
          });
        }}
        className="flex flex-col gap-2 rounded-md border border-border bg-surface/70 p-3"
      >
        <Input name="valorOrcamento" type="number" step="0.01" placeholder="Valor R$" required />
        <Input name="prestadorNome" placeholder="Prestador" required />
        <Input name="prestadorContato" placeholder="Contato" />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={busy}>Salvar</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setModo(null)}>Cancelar</Button>
        </div>
      </form>
    );
  }

  if (modo === 'rejeitar') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          call(`/api/manutencoes/${id}/rejeitar`, { motivoRejeicao: fd.get('motivoRejeicao') });
        }}
        className="flex flex-col gap-2 rounded-md border border-border bg-surface/70 p-3"
      >
        <Input name="motivoRejeicao" placeholder="Motivo da rejeição" required />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={busy}>Confirmar</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setModo(null)}>Cancelar</Button>
        </div>
      </form>
    );
  }

  const isAdmin = role === 'admin' || role === 'corretor';
  const isProprietario = role === 'proprietario';

  return (
    <div className="flex flex-wrap gap-2">
      {(isAdmin || isProprietario) && ['aberta', 'orcamento'].includes(status) && (
        <Button size="sm" variant="secondary" onClick={() => setModo('orcamento')}>Anexar orçamento</Button>
      )}
      {(isAdmin || isProprietario) && status === 'aguardando_aprovacao' && (
        <>
          <Button size="sm" disabled={busy} onClick={() => call(`/api/manutencoes/${id}/aprovar`, {})}>Aprovar</Button>
          <Button size="sm" variant="ghost" onClick={() => setModo('rejeitar')}>Rejeitar</Button>
        </>
      )}
      {(isAdmin || isProprietario) && status === 'aprovada' && (
        <Button size="sm" disabled={busy} onClick={() => call(`/api/manutencoes/${id}/concluir`, {})}>Concluir</Button>
      )}
      {valorOrcamento != null && (
        <span className="self-center text-xs text-fg-muted">R$ {valorOrcamento.toFixed(2)}</span>
      )}
    </div>
  );
}
