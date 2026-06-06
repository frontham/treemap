'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/cn';
import { Wordmark } from '@/components/brand/Logo';

/** Landing grid of the org's projects; each card opens that project's map. */
export function ProjectPicker() {
  const { data: me } = trpc.auth.me.useQuery();
  const { data: projects = [], isLoading } = trpc.projects.list.useQuery(undefined, {
    enabled: !!me?.org,
  });
  const orgSlug = me?.org?.slug;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Wordmark className="mb-6" />
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Projects</h1>
          <p className="text-sm text-muted">
            {me?.user?.name ?? me?.user?.email} · {me?.org?.role}
          </p>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted">No projects yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/orgs/${orgSlug}/projects/${p.slug}/map` as Route}
                className={cn(
                  'flex items-center justify-between rounded-lg bg-panel p-4 hairline',
                  'transition-colors hover:bg-paper',
                )}
              >
                <span className="font-medium text-ink">{p.name}</span>
                <span className="text-xs uppercase tracking-wider text-muted">{p.role}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
