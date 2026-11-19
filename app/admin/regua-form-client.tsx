'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Regua = { d0: string; d1: string; d5: string; d10: string; d30: string };

export default function ReguaForm({ regua }: { regua: Regua }) {
  const [r, setR] = useState<Regua>(regua);
  const [msg, setMsg] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/regua-cobranca', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r),
    });
    setMsg(res.ok ? 'Régua atualizada.' : 'Falha ao salvar.');
  }

  const campos: (keyof Regua)[] = ['d0', 'd1', 'd5', 'd10', 'd30'];

  return (
    <form onSubmit={salvar} className="space-y-3">
      {campos.map(k => (
        <div key={k}>
          <label className="mb-1 block text-xs uppercase tracking-wide text-fg-muted">{k}</label>
          <Input value={r[k]} onChange={e => setR({ ...r, [k]: e.target.value })} />
        </div>
      ))}
      <Button type="submit" variant="primary" size="sm">Salvar régua</Button>
      {msg && <p className="text-xs text-brand">{msg}</p>}
    </form>
  );
}
