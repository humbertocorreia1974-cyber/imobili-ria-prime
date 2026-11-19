'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type G = {
  gatewayProvider: string;
  gatewayApiKey: string;
  clicksignEnabled: boolean;
  clicksignToken: string;
  whatsappEnabled: boolean;
  whatsappPhoneId: string;
  whatsappToken: string;
};

export default function GatewayForm({ inicial }: { inicial: G }) {
  const [g, setG] = useState(inicial);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/imobiliaria/gateway', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(g),
    });
    setSaving(false);
    setMsg(res.ok ? 'Integrações salvas.' : 'Falha ao salvar.');
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Gateway de pagamento</label>
        <select
          value={g.gatewayProvider}
          onChange={e => setG({ ...g, gatewayProvider: e.target.value })}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
        >
          <option value="asaas">Asaas</option>
          <option value="stripe">Stripe</option>
          <option value="pagarme">Pagar.me</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">API Key do gateway</label>
        <Input
          type="password"
          value={g.gatewayApiKey}
          onChange={e => setG({ ...g, gatewayApiKey: e.target.value })}
          placeholder="chave secreta"
        />
      </div>

      <div className="rounded-md border border-border p-3">
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            checked={g.clicksignEnabled}
            onChange={e => setG({ ...g, clicksignEnabled: e.target.checked })}
            className="h-4 w-4 accent-[color:var(--brand)]"
          />
          Assinatura eletrônica (Clicksign)
        </label>
        {g.clicksignEnabled && (
          <Input
            className="mt-2"
            type="password"
            value={g.clicksignToken}
            onChange={e => setG({ ...g, clicksignToken: e.target.value })}
            placeholder="token Clicksign"
          />
        )}
      </div>

      <div className="rounded-md border border-border p-3">
        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            checked={g.whatsappEnabled}
            onChange={e => setG({ ...g, whatsappEnabled: e.target.checked })}
            className="h-4 w-4 accent-[color:var(--brand)]"
          />
          WhatsApp Cloud API
        </label>
        {g.whatsappEnabled && (
          <div className="mt-2 space-y-2">
            <Input
              value={g.whatsappPhoneId}
              onChange={e => setG({ ...g, whatsappPhoneId: e.target.value })}
              placeholder="Phone Number ID"
            />
            <Input
              type="password"
              value={g.whatsappToken}
              onChange={e => setG({ ...g, whatsappToken: e.target.value })}
              placeholder="Access Token"
            />
          </div>
        )}
      </div>

      <Button type="submit" variant="primary" size="sm" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar integrações'}
      </Button>
      {msg && <p className="text-xs text-brand">{msg}</p>}
    </form>
  );
}
