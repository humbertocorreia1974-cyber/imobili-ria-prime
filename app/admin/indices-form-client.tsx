'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const INDICES = ['IGP-M', 'IPCA', 'INCC', 'IGP-DI'];

export default function IndicesForm({ indicePadrao }: { indicePadrao: string }) {
  const [indice, setIndice] = useState(indicePadrao);
  const [percentual, setPercentual] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/indices', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ indicePadrao: indice, percentualManual: percentual || null }),
    });
    setMsg(res.ok ? 'Índices atualizados.' : 'Falha ao salvar.');
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Índice padrão</label>
        <select
          value={indice}
          onChange={e => setIndice(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          {INDICES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Percentual manual (opcional)</label>
        <Input
          value={percentual}
          onChange={e => setPercentual(e.target.value)}
          placeholder="ex: 4.85"
          inputMode="decimal"
        />
      </div>
      <Button type="submit" variant="primary" size="sm">Salvar índices</Button>
      {msg && <p className="text-xs text-brand">{msg}</p>}
    </form>
  );
}
