'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm({ role, callbackUrl }: { role: string; callbackUrl?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') ?? '');
    const password = String(fd.get('password') ?? '');

    const res = await signIn('credentials', { email, password, redirect: false });
    if (!res || res.error) {
      setErro('E-mail ou senha inválidos');
      setLoading(false);
      return;
    }

    try {
      await fetch('/api/auth/select-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
    } catch {
      // não bloqueia o login se falhar
    }

    router.push(callbackUrl ?? '/painel');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border bg-surface/70 p-6 backdrop-blur-sm">
      <Input name="email" type="email" placeholder="E-mail" required autoComplete="email" />
      <Input name="password" type="password" placeholder="Senha" required autoComplete="current-password" />
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
      <div className="relative my-2 text-center text-xs text-fg-muted">
        <span className="bg-surface/70 px-2">ou</span>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => signIn('google', { callbackUrl: callbackUrl ?? '/painel' })}
      >
        Continuar com Google
      </Button>
      <p className="text-center text-xs text-fg-muted">
        <a href="/esqueci-senha" className="hover:text-fg">Esqueci minha senha</a>
      </p>
    </form>
  );
}
