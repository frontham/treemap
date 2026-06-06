'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { trpc } from '@/lib/trpc/client';
import { IconButton } from '@/components/ui/IconButton';
import { UserIcon } from '@/components/icons';
import { useRole } from '@/components/auth/useRole';

/** Account button → dropdown with the signed-in user, members link, and logout. */
export function UserMenu() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { me, isOrgAdmin } = useRole();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      router.push('/login');
      router.refresh();
    },
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const orgSlug = me?.org?.slug;

  return (
    <div ref={ref} className="relative">
      <IconButton
        label="Account"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-panel/85 hairline shadow-floating backdrop-blur-md"
      >
        <UserIcon size={16} />
      </IconButton>

      {open ? (
        <div className="absolute right-0 mt-1.5 w-56 overflow-hidden rounded-lg bg-paper hairline shadow-floating">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-ink">{me?.user?.name ?? 'Account'}</p>
            <p className="truncate text-xs text-muted">{me?.user?.email}</p>
          </div>
          <div className="h-px bg-hairline" />
          {isOrgAdmin && orgSlug ? (
            <Link
              href={`/orgs/${orgSlug}/members` as Route}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-ink transition-colors hover:bg-panel"
            >
              Manage members
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="block w-full px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-panel"
          >
            {logout.isPending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
