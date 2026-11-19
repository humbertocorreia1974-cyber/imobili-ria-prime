'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ContratoAcoesClient({
  contratoId,
  tipo,
  status,
  indiceReajuste,
  valorAtual,
}: {
  contratoId: string;
  tipo: string;
  status: string;
  indiceReajuste: string;
  valorAtual: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<null | 'reajuste' | 'encerrar'>(null);
  const [percentual, setPercentual] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function aplicarReajuste() {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`/api/contratos/${contratoId}/reajuste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indice: indiceReajuste, percentual: Number(percentual) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao aplicar reajuste');
      setMsg(`Reajuste aplicado: ${data.valorAnterior} → ${data.valorNovo}`);
      setOpen(null);
      router.refresh();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function encerrar() {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`/api/contratos/${contratoId}/encerrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao encerrar');
      setMsg('Contrato encerrado.');
      setOpen(null);
      router.refresh();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {tipo === 'locacao' && status === 'ativo' && (
          <Button size="sm" variant="secondary" onClick={() => setOpen(open === 'reajuste' ? null : 'reajuste')}>
            Reajuste
          </Button>
        )}
        {status === 'ativo' && (
          <Button size="sm" variant="ghost" onClick={() => setOpen(open === 'encerrar' ? null : 'encerrar')}>
            Encerrar
          </Button>
        )}
      </div>
      {open === 'reajuste' && (
        <div className="w-64 rounded-md border border-border bg-surface p-3 text-left">
          <p className="mb-2 text-xs text-fg-muted">
            Índice {indiceReajuste} · valor atual R$ {valorAtual.toFixed(2)}
          </p>
          <Input
            type="number"
            step="0.01"
            placeholder="% do reajuste"
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
          />
          <Button size="sm" variant="primary" className="mt-2 w-full" disabled={loading || !percentual} onClick={aplicarReajuste}>
            {loading ? 'Aplicando…' : 'Aplicar'}
          </Button>
        </div>
      )}
      {open === 'encerrar' && (
        <div className="w-64 rounded-md border border-border bg-surface p-3 text-left">
          <Input placeholder="Motivo do encerramento" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <Button size="sm" variant="primary" className="mt-2 w-full" disabled={loading} onClick={encerrar}>
            {loading ? 'Encerrando…' : 'Confirmar'}
          </Button>
        </div>
      )}
      {msg && <p className="max-w-[16rem] text-xs text-fg-muted">{msg}</p>}
    </div>
  );
}
