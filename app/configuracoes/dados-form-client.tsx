'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Dados = {
  nome: string; cnpj: string; email: string; telefone: string; endereco: string;
  taxaAdministracaoPct: number; diaRepasse: number;
};

export default function DadosForm({ inicial }: { inicial: Dados }) {
  const [d, setD] = useState(inicial);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/imobiliaria', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
    });
    setSaving(false);
    setMsg(res.ok ? 'Dados salvos com sucesso.' : 'Falha ao salvar.');
  }

  return (
    <form onSubmit={salvar} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Nome</label>
        <Input value={d.nome} onChange={e => setD({ ...d, nome: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-fg-muted">CNPJ</label>
          <Input value={d.cnpj} onChange={e => setD({ ...d, cnpj: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-fg-muted">Telefone</label>
          <Input value={d.telefone} onChange={e => setD({ ...d, telefone: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">E-mail</label>
        <Input type="email" value={d.email} onChange={e => setD({ ...d, email: e.target.value })} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Endereço</label>
        <Input value={d.endereco} onChange={e => setD({ ...d, endereco: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-fg-muted">Taxa admin (%)</label>
          <Input
            type="number" step="0.1" min="0" max="100"
            value={d.taxaAdministracaoPct}
            onChange={e => setD({ ...d, taxaAdministracaoPct: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-fg-muted">Dia do repasse</label>
          <Input
            type="number" min="1" max="28"
            value={d.diaRepasse}
            onChange={e => setD({ ...d, diaRepasse: Number(e.target.value) })}
          />
        </div>
      </div>
      <Button type="submit" variant="primary" size="sm" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar dados'}
      </Button>
      {msg && <p className="text-xs text-brand">{msg}</p>}
    </form>
  );
}
