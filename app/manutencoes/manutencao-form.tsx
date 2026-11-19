'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Imovel = { id: string; codigo: string; titulo: string };

export function ManutencaoForm({ imoveis }: { imoveis: Imovel[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      imovelId: fd.get('imovelId'),
      titulo: fd.get('titulo'),
      descricao: fd.get('descricao'),
      categoria: fd.get('categoria'),
      urgencia: fd.get('urgencia'),
    };
    const res = await fetch('/api/manutencoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErro(j.error ?? 'Falha ao abrir manutenção');
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Abrir manutenção</Button>;
  }

  return (
    <form onSubmit={submit} className="w-full max-w-xl rounded-lg border border-border bg-surface/70 p-4 backdrop-blur-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="imovelId" required className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg sm:col-span-2">
          <option value="">Selecione o imóvel…</option>
          {imoveis.map((i) => (
            <option key={i.id} value={i.id}>{i.codigo} — {i.titulo}</option>
          ))}
        </select>
        <Input name="titulo" placeholder="Título (ex: Vazamento na cozinha)" required className="sm:col-span-2" />
        <textarea
          name="descricao"
          required
          rows={3}
          placeholder="Descreva o problema com detalhes"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg sm:col-span-2"
        />
        <select name="categoria" className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
          <option value="hidraulica">Hidráulica</option>
          <option value="eletrica">Elétrica</option>
          <option value="pintura">Pintura</option>
          <option value="estrutural">Estrutural</option>
          <option value="outros">Outros</option>
        </select>
        <select name="urgencia" className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg">
          <option value="baixa">Baixa</option>
          <option value="normal">Normal</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>
      {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}
      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? 'Enviando…' : 'Enviar'}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  );
}
