'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PropostaFormClient({ imovelId }: { imovelId: string }) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState('');
  const [tipo, setTipo] = useState('locacao');
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/propostas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imovelId, clienteId, tipo, valor: Number(valor) }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Falha ao criar proposta');
      setClienteId(''); setValor('');
      setMsg('Proposta registrada.');
      router.refresh();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-xs uppercase text-fg-muted">Nova proposta</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input placeholder="ID do cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)} required />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
          <option value="locacao">Locação</option>
          <option value="compra">Compra</option>
        </select>
        <Input type="number" step="0.01" placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} required />
      </div>
      <Button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Registrar proposta'}</Button>
      {msg && <p className="text-xs text-fg-muted">{msg}</p>}
    </form>
  );
}
