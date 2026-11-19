'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const OPCOES = ['disponivel', 'reservado', 'locado', 'vendido'];

export function ImovelAcoesClient({ imovelId, situacaoAtual }: { imovelId: string; situacaoAtual: string }) {
  const router = useRouter();
  const [situacao, setSituacao] = useState(situacaoAtual);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function salvar() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/imoveis/${imovelId}/situacao`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situacao }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Falha ao atualizar');
      setMsg('Situação atualizada.');
      router.refresh();
    } catch (e: any) {
      setMsg(e.message ?? 'Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <CardTitle>Ações rápidas</CardTitle>
        <label className="mt-3 block text-xs text-fg-muted">Situação do imóvel</label>
        <select
          value={situacao}
          onChange={(e) => setSituacao(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-surface/70 px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand"
        >
          {OPCOES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <Button className="mt-3 w-full" size="sm" onClick={salvar} disabled={loading || situacao === situacaoAtual}>
          {loading ? 'Salvando…' : 'Atualizar situação'}
        </Button>
        {msg && <p className="mt-2 text-xs text-fg-muted">{msg}</p>}
      </CardBody>
    </Card>
  );
}
