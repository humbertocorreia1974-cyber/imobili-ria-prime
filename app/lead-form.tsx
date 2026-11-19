'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LeadForm() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      nome: String(fd.get('nome') ?? ''),
      telefone: String(fd.get('telefone') ?? ''),
      email: String(fd.get('email') ?? ''),
      interesseTipo: String(fd.get('interesseTipo') ?? ''),
      observacoes: String(fd.get('observacoes') ?? ''),
    };
    try {
      const res = await fetch('/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Falha ao enviar');
      }
      setOk(true);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setErro(err.message ?? 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return (
      <div className="rounded-lg border border-border bg-surface/70 p-6 backdrop-blur-sm">
        <p className="font-medium text-brand">Recebemos seus dados!</p>
        <p className="mt-1 text-sm text-fg-muted">Um corretor entrará em contato em breve.</p>
        <button onClick={() => setOk(false)} className="mt-3 text-xs text-brand hover:underline">
          Enviar outro lead
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border bg-surface/70 p-6 backdrop-blur-sm">
      <Input name="nome" placeholder="Seu nome" required />
      <Input name="telefone" placeholder="Telefone (WhatsApp)" required />
      <Input name="email" type="email" placeholder="E-mail (opcional)" />
      <select name="interesseTipo" className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg">
        <option value="locacao">Quero alugar</option>
        <option value="venda">Quero comprar</option>
      </select>
      <textarea
        name="observacoes"
        rows={3}
        placeholder="Conte um pouco do que procura..."
        className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-brand"
      />
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Enviando...' : 'Quero ser contatado'}
      </Button>
    </form>
  );
}
