'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench } from 'lucide-react';

export default function AbrirManutencaoForm({ imovelId }: { imovelId: string }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('hidraulica');
  const [urgencia, setUrgencia] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/manutencoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imovelId, titulo, descricao, categoria, urgencia }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Falha ao abrir');
      setTitulo('');
      setDescricao('');
      setMsg('Solicitação enviada com sucesso.');
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <Input placeholder="Título (ex: Vazamento na cozinha)" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
      <textarea
        className="w-full rounded-md border border-border bg-surface/70 px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
        rows={3}
        placeholder="Descreva o problema com detalhes"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        required
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          className="rounded-md border border-border bg-surface/70 px-3 py-2 text-sm text-fg"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="hidraulica">Hidráulica</option>
          <option value="eletrica">Elétrica</option>
          <option value="pintura">Pintura</option>
          <option value="estrutural">Estrutural</option>
          <option value="outros">Outros</option>
        </select>
        <select
          className="rounded-md border border-border bg-surface/70 px-3 py-2 text-sm text-fg"
          value={urgencia}
          onChange={(e) => setUrgencia(e.target.value)}
        >
          <option value="baixa">Baixa</option>
          <option value="normal">Normal</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>
      <Button type="submit" variant="primary" disabled={loading}>
        <Wrench className="mr-2 h-4 w-4" />
        {loading ? 'Enviando...' : 'Abrir solicitação'}
      </Button>
      {msg && <p className="text-xs text-fg-muted">{msg}</p>}
    </form>
  );
}
