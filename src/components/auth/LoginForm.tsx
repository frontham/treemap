'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/Button';
import { inputBase } from '@/components/forms/fields/FieldShell';
import { cn } from '@/lib/cn';

export function LoginForm() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      const next = new URLSearchParams(window.location.search).get('next');
      const dest = (next && next.startsWith('/') ? next : '/orgs/demo') as Route;
      router.push(dest);
      router.refresh();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        login.mutate({ email: email.trim(), password });
      }}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-panel p-6 hairline"
    >
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-ink">Sign in to TreeMap</h1>
        <p className="text-sm text-muted">Use your account email and password.</p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Email</span>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(inputBase)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={cn(inputBase)}
        />
      </label>

      {login.error && (
        <p className="text-sm text-danger">{login.error.message}</p>
      )}

      <Button type="submit" disabled={login.isPending} className="mt-1">
        {login.isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
