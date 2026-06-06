'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/Button';
import { inputBase } from '@/components/forms/fields/FieldShell';
import { cn } from '@/lib/cn';

const ROLES = ['owner', 'admin', 'editor', 'viewer'] as const;
type Role = (typeof ROLES)[number];

/** Org-admin member management: list, change role, remove, and add members. */
export function OrgMembersManager() {
  const utils = trpc.useUtils();
  const { data: members = [], error, isLoading } = trpc.members.listOrg.useQuery();
  const invalidate = () => utils.members.listOrg.invalidate();

  const updateRole = trpc.members.updateOrgRole.useMutation({ onSuccess: invalidate });
  const remove = trpc.members.removeOrg.useMutation({ onSuccess: invalidate });
  const add = trpc.members.addOrg.useMutation({
    onSuccess: () => {
      invalidate();
      setForm({ email: '', name: '', password: '', role: 'viewer' });
    },
  });

  const [form, setForm] = useState<{ email: string; name: string; password: string; role: Role }>({
    email: '',
    name: '',
    password: '',
    role: 'viewer',
  });

  if (error) {
    return <p className="text-sm text-muted">You need to be an org admin to manage members.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">Members</h2>
        {isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <ul className="divide-y divide-hairline rounded-lg bg-panel hairline">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{m.name ?? m.email}</p>
                  <p className="truncate text-xs text-muted">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    onChange={(e) =>
                      updateRole.mutate({ userId: m.userId, role: e.target.value as Role })
                    }
                    className={cn(inputBase, 'h-8')}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger/10"
                    onClick={() => remove.mutate({ userId: m.userId })}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">Add member</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate({
              email: form.email.trim(),
              name: form.name.trim() || undefined,
              password: form.password,
              role: form.role,
            });
          }}
          className="grid grid-cols-1 gap-3 rounded-lg bg-panel p-4 hairline sm:grid-cols-2"
        >
          <input
            className={inputBase}
            type="email"
            required
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className={inputBase}
            placeholder="Name (optional)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={inputBase}
            type="password"
            required
            minLength={8}
            placeholder="Initial password (min 8)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <select
            className={inputBase}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {add.error ? (
            <p className="text-sm text-danger sm:col-span-2">{add.error.message}</p>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={add.isPending}>
              {add.isPending ? 'Adding…' : 'Add member'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
