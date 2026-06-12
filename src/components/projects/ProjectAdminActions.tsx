'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/Button';
import { inputBase } from '@/components/forms/fields/FieldShell';
import { useRole } from '@/components/auth/useRole';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useDialog } from '@/components/ui/dialog/DialogProvider';

/** Rename / delete the active project. Org-admin only. */
export function ProjectAdminActions() {
  const t = useT();
  const { confirm } = useDialog();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { me, isOrgAdmin } = useRole();
  const { data: projects = [] } = trpc.projects.list.useQuery(undefined, { enabled: !!me?.org });
  const current = projects.find((p) => p.id === me?.project?.id);
  const [name, setName] = useState('');

  useEffect(() => {
    if (current) setName(current.name);
  }, [current?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const rename = trpc.projects.rename.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      utils.auth.me.invalidate();
    },
  });
  const del = trpc.projects.delete.useMutation({
    onSuccess: () => {
      router.push(`/orgs/${me?.org?.slug}` as Route);
      router.refresh();
    },
  });

  if (!isOrgAdmin || !current || !me?.project) return null;
  const projectId = me.project.id;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">
          {t('projects.name')}
        </h2>
        <div className="flex gap-2">
          <input className={inputBase} value={name} onChange={(e) => setName(e.target.value)} />
          <Button
            disabled={rename.isPending || !name.trim() || name === current.name}
            onClick={() => rename.mutate({ id: projectId, name: name.trim() })}
          >
            {rename.isPending ? t('common.saving') : t('projects.rename')}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-danger/40 p-4">
        <h2 className="text-sm font-medium text-danger">{t('projects.dangerZone')}</h2>
        <p className="mt-1 text-sm text-muted">{t('projects.deleteDesc')}</p>
        <Button
          variant="danger"
          className="mt-3"
          disabled={del.isPending}
          onClick={async () => {
            const ok = await confirm({
              message: t('projects.deleteConfirm', { name: current.name }),
              confirmLabel: t('projects.delete'),
              danger: true,
            });
            if (ok) del.mutate({ id: projectId });
          }}
        >
          {del.isPending ? t('projects.deleting') : t('projects.delete')}
        </Button>
      </div>
    </section>
  );
}
