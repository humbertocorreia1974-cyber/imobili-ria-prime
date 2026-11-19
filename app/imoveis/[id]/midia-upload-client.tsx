'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function MidiaUploadClient({ imovelId }: { imovelId: string }) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [legenda, setLegenda] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/imoveis/${imovelId}/midia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, legenda, tipo: 'foto' }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Falha ao salvar');
      setUrl(''); setLegenda('');
      setMsg('Mídia adicionada.');
      router.refresh();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 border-t border-border pt-4">
      <p className="text-xs uppercase text-fg-muted">Adicionar mídia por URL</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" />
        <Input placeholder="Legenda (opcional)" value={legenda} onChange={(e) => setLegenda(e.target.value)} className="sm:w-64" />
        <Button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Adicionar'}</Button>
      </div>
      {msg && <p className="text-xs text-fg-muted">{msg}</p>}
    </form>
  );
}
