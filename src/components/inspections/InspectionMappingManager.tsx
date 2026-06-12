'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { trpc } from '@/lib/trpc/client';
import { useRole } from '@/components/auth/useRole';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useToast } from '@/components/ui/toast/ToastProvider';
import type { CustomFieldDefView } from '@/server/trpc/routers/customFields';

function MappingSelect({
  label,
  value,
  defs,
  onChange,
  noneLabel,
}: {
  label: string;
  value: string;
  defs: CustomFieldDefView[];
  onChange: (v: string) => void;
  noneLabel: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded bg-paper px-2 py-1.5 text-sm hairline focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="">{noneLabel}</option>
        {defs.map((d) => (
          <option key={d.id} value={d.key}>
            {d.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type Sel = { dateKey: string; inspectorKey: string; externalIdKey: string };

/**
 * Project-settings card: map imported custom fields to inspection metadata
 * (date / inspector / external id), then backfill existing trees into the
 * inspection log. Admin only.
 */
export function InspectionMappingManager() {
  const { can } = useRole();
  const t = useT();
  const toast = useToast();
  const utils = trpc.useUtils();
  const { data: defs = [] } = trpc.customFields.list.useQuery();
  const { data: mapping } = trpc.inspections.mapping.useQuery();
  const [sel, setSel] = useState<Sel>({ dateKey: '', inspectorKey: '', externalIdKey: '' });

  useEffect(() => {
    if (mapping) {
      setSel({
        dateKey: mapping.dateKey ?? '',
        inspectorKey: mapping.inspectorKey ?? '',
        externalIdKey: mapping.externalIdKey ?? '',
      });
    }
  }, [mapping]);

  const save = trpc.inspections.setMapping.useMutation({
    onSuccess: () => utils.inspections.mapping.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const backfill = trpc.inspections.backfill.useMutation({
    onSuccess: (r) => toast.success(t('mapping.backfilled', { count: r.inserted })),
    onError: (e) => toast.error(e.message),
  });

  if (!can('admin')) return null;

  return (
    <section className="rounded-lg p-4 hairline bg-panel/40">
      <h2 className="text-sm font-semibold text-ink">{t('mapping.title')}</h2>
      <p className="mt-1 text-xs text-muted">{t('mapping.desc')}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <MappingSelect
          label={t('mapping.date')}
          value={sel.dateKey}
          defs={defs}
          noneLabel={t('mapping.none')}
          onChange={(v) => setSel((s) => ({ ...s, dateKey: v }))}
        />
        <MappingSelect
          label={t('mapping.inspector')}
          value={sel.inspectorKey}
          defs={defs}
          noneLabel={t('mapping.none')}
          onChange={(v) => setSel((s) => ({ ...s, inspectorKey: v }))}
        />
        <MappingSelect
          label={t('mapping.externalId')}
          value={sel.externalIdKey}
          defs={defs}
          noneLabel={t('mapping.none')}
          onChange={(v) => setSel((s) => ({ ...s, externalIdKey: v }))}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() =>
            save.mutate({
              dateKey: sel.dateKey || null,
              inspectorKey: sel.inspectorKey || null,
              externalIdKey: sel.externalIdKey || null,
            })
          }
          disabled={save.isPending}
        >
          {save.isPending ? t('common.saving') : t('mapping.save')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => backfill.mutate()}
          disabled={backfill.isPending || !sel.dateKey}
        >
          {backfill.isPending ? t('mapping.backfilling') : t('mapping.backfill')}
        </Button>
        {!sel.dateKey ? (
          <span className="text-xs text-muted">{t('mapping.pickDate')}</span>
        ) : null}
      </div>
    </section>
  );
}
