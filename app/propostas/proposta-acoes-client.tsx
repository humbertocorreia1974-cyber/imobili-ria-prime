'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  propostaId: string;
  status: string;
  valorAtual: number;
  podeAprovar: boolean;
};

export function PropostaAcoes({ propostaId, status, valorAtual, podeAprovar }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [aberto, setAberto] = useState<'contra' | 'rejeitar' | null>(null);
  const [valor, setValor] = useState(String(valorAtual));
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const finalizada = ['aprovada', 'rejeitada', 'cancelada', 'convertida'].includes(status);

  async function post(url: string, body: Record<string, unknown>) {
    setErro(null);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErro(j.error ?? 'Falha ao executar ação');
      return false;
    }
    return true;
  }

  async function enviarContra() {
    const ok = await post(`/api/propostas/${propostaId}/contraproposta`, {
      valor: Number(valor),
      mensagem,
      autorTipo: podeAprovar ? 'proprietario' : 'corretor',
    });
    if (ok) {
      setAberto(null);
      setMensagem('');
      startTransition(() => router.refresh());
    }
  }

  async function aprovar() {
    const ok = await post(`/api/propostas/${propostaId}/aprovar`, {});
    if (ok) startTransition(() => router.refresh());
  }

  async function rejeitar() {
    const ok = await post(`/api/propostas/${propostaId}/rejeitar`, { motivo: mensagem || 'Sem motivo informado' });
    if (ok) {
      setAberto(null);
      setMensagem('');
      startTransition(() => router.refresh());
    }
  }

  async function converter() {
    const ok = await post(`/api/propostas/${propostaId}/converter-contrato`, {});
    if (ok) startTransition(() => router.refresh());
  }

  if (finalizada) {
    return (
      <div className="text-right text-xs text-fg-muted">
        {status === 'aprovada' && (
          <Button variant="secondary" size="sm" onClick={converter} disabled={pending}>
            Gerar contrato
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs space-y-2 text-right">
      <div className="flex flex-wrap justify-end gap-2">
        {podeAprovar && (
          <Button variant="primary" size="sm" onClick={aprovar} disabled={pending}>
            Aprovar
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => setAberto(aberto === 'contra' ? null : 'contra')}>
          Contraproposta
        </Button>
        {podeAprovar && (
          <Button variant="ghost" size="sm" onClick={() => setAberto(aberto === 'rejeitar' ? null : 'rejeitar')}>
            Rejeitar
          </Button>
        )}
      </div>

      {aberto === 'contra' && (
        <div className="space-y-2 rounded-md border border-border bg-surface/70 p-3 text-left backdrop-blur-sm">
          <label className="block text-xs text-fg-muted">Novo valor</label>
          <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
          <label className="block text-xs text-fg-muted">Mensagem</label>
          <Input value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Condições, prazo..." />
          <Button variant="primary" size="sm" onClick={enviarContra} disabled={pending}>
            Enviar contraproposta
          </Button>
        </div>
      )}

      {aberto === 'rejeitar' && (
        <div className="space-y-2 rounded-md border border-border bg-surface/70 p-3 text-left backdrop-blur-sm">
          <label className="block text-xs text-fg-muted">Motivo da rejeição</label>
          <Input value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Ex: valor abaixo do mínimo" />
          <Button variant="primary" size="sm" onClick={rejeitar} disabled={pending}>
            Confirmar rejeição
          </Button>
        </div>
      )}

      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
}
