'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type U = { id: string; name: string; email: string; role: string; plan: string; createdAt: string };

const PAPEIS = ['admin', 'corretor', 'proprietario', 'inquilino', 'user'];

export default function UsuariosTable({ usuarios }: { usuarios: U[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function alterar(id: string, role: string) {
    const res = await fetch(`/api/admin/usuarios/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setMsg('Papel atualizado.');
      start(() => router.refresh());
    } else {
      setMsg('Falha ao atualizar papel.');
    }
  }

  if (usuarios.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-fg-muted">
        Nenhum usuário cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {msg && <p className="mb-3 text-xs text-brand">{msg}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
            <th className="py-2 pr-4">Nome</th>
            <th className="py-2 pr-4">E-mail</th>
            <th className="py-2 pr-4">Plano</th>
            <th className="py-2 pr-4">Papel</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id} className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5">
              <td className="py-2 pr-4 text-fg">{u.name}</td>
              <td className="py-2 pr-4 text-fg-muted">{u.email}</td>
              <td className="py-2 pr-4">
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">{u.plan}</span>
              </td>
              <td className="py-2 pr-4">
                <select
                  defaultValue={u.role}
                  disabled={pending}
                  onChange={e => alterar(u.id, e.target.value)}
                  className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {PAPEIS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
