'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CorretorFormClient() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', creci: '', comissaoPadraoPct: '6', metaMensal: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    try {
      const res = await fetch('/api/corretores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          creci: form.creci || null,
          comissaoPadraoPct: Number(form.comissaoPadraoPct) || 6,
          metaMensal: form.metaMensal ? Number(form.metaMensal) : null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Falha ao cadastrar');
      setForm({ nome: '', email: '', telefone: '', creci: '', comissaoPadraoPct: '6', metaMensal: '' });
      setMsg('Corretor cadastrado.');
      router.refresh();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Input placeholder="Nome completo" value={form.nome} onChange={(e) => set('nome', e.target.value)} required />
      <Input type="email" placeholder="E-mail" value={form.email} onChange={(e) => set('email', e.target.value)} required />
      <Input placeholder="Telefone" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} required />
      <Input placeholder="CRECI" value={form.creci} onChange={(e) => set('creci', e.target.value)} />
      <Input type="number" step="0.1" placeholder="Comissão padrão (%)" value={form.comissaoPadraoPct} onChange={(e) => set('comissaoPadraoPct', e.target.value)} />
      <Input type="number" step="0.01" placeholder="Meta mensal (R$)" value={form.metaMensal} onChange={(e) => set('metaMensal', e.target.value)} />
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Cadastrar corretor'}</Button>
        {msg && <span className="text-xs text-fg-muted">{msg}</span>}
      </div>
    </form>
  );
}
