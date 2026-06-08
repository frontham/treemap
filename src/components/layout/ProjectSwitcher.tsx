'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { trpc } from '@/lib/trpc/client';
import { ChevronDownIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/LocaleProvider';

const chrome =
  'inline-flex h-9 items-center gap-2 rounded-full px-3 bg-panel/85 ' +
  'backdrop-blur-md hairline shadow-floating text-sm';

/**
 * Active-project pill that drops down the org's projects. Selecting one
 * navigates to that project's map (which re-points the org/project cookies via
 * middleware). The current project + role come from trpc.auth.me.
 */
export function ProjectSwitcher() {
  const t = useT();
  const { data: me } = trpc.auth.me.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery(undefined, {
    enabled: !!me?.org,
  });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const orgSlug = me?.org?.slug;
  const current = projects.find((p) => p.id === me?.project?.id);

  return (
    <div ref={ref} className="pointer-events-auto relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className={chrome}>
        <span className="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden />
        <span className="font-medium text-ink">{current?.name ?? t('projects.selectProject')}</span>
        <ChevronDownIcon size={14} className="text-muted" />
      </button>

      {open && orgSlug ? (
        <div className="absolute left-0 mt-1.5 w-60 overflow-hidden rounded-lg bg-paper hairline shadow-floating">
          <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-muted">
            {t('projects.title')}
          </p>
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/orgs/${orgSlug}/projects/${p.slug}/map` as Route}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-panel',
                p.id === me?.project?.id ? 'text-accent' : 'text-ink',
              )}
            >
              <span>{p.name}</span>
              <span className="text-xs text-muted">{p.role}</span>
            </Link>
          ))}
          <div className="h-px bg-hairline" />
          {current && me?.project && ['admin', 'owner'].includes(me.project.role) ? (
            <Link
              href={`/orgs/${orgSlug}/projects/${current.slug}/settings` as Route}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-ink transition-colors hover:bg-panel"
            >
              {t('projects.settings')}
            </Link>
          ) : null}
          <Link
            href={`/orgs/${orgSlug}` as Route}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-muted transition-colors hover:bg-panel"
          >
            {t('projects.allProjects')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
