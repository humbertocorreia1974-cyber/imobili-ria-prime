'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function ManutencaoAprovarClient({ manutencaoId }: { manutencaoId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  async function acao(tipo: 'aprovar' | 'rejeitar') {
    setErro(null);
    let motivo: string | undefined;
    if (tipo === 'rejeitar') {
      const r = window.prompt('Motivo da rejeição:');
      if (!r) return;
      motivo = r;
    }
    const res = await fetch('/api/portal/proprietario/manutencao', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manutencaoId, acao: tipo, motivo }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErro(j.error ?? 'Falha ao processar');
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button size="sm" variant="primary" disabled={pending} onClick={() => acao('aprovar')}>
          Aprovar
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => acao('rejeitar')}>
          Rejeitar
        </Button>
      </div>
      {erro && <p className="text-xs text-accent">{erro}</p>}
    </div>
  );
}
