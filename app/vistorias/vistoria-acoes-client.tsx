'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

type ImovelOpt = { id: string; codigo: string; titulo: string };

export default function VistoriaAcoesClient({ mode, imoveis }: { mode: 'nova'; imoveis: ImovelOpt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [imovelId, setImovelId] = useState('');
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function criar() {
    if (!imovelId) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/vistorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imovelId, tipo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao criar vistoria');
      setOpen(false);
      router.push(`/vistorias/${data.id}`);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <Button variant="primary" size="md" onClick={() => setOpen((v) => !v)}>
        <Plus className="mr-2 h-4 w-4" /> Nova vistoria
      </Button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-md border border-border bg-surface p-4 shadow-lg backdrop-blur-sm">
          <p className="mb-3 text-sm font-medium text-fg">Abrir vistoria</p>
          <label className="mb-2 flex flex-col text-xs text-fg-muted">
            Imóvel
            <select
              value={imovelId}
              onChange={(e) => setImovelId(e.target.value)}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            >
              <option value="">Selecione…</option>
              {imoveis.map((i) => (
                <option key={i.id} value={i.id}>{i.codigo} — {i.titulo}</option>
              ))}
            </select>
          </label>
          <label className="mb-3 flex flex-col text-xs text-fg-muted">
            Tipo
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'entrada' | 'saida')}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
            >
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </label>
          <Button size="sm" variant="primary" className="w-full" disabled={loading || !imovelId} onClick={criar}>
            {loading ? 'Criando…' : 'Criar vistoria'}
          </Button>
          {msg && <p className="mt-2 text-xs text-red-400">{msg}</p>}
        </div>
      )}
    </div>
  );
}
