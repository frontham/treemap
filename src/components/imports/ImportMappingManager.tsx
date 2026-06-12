'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { inputBase } from '@/components/forms/fields/FieldShell';
import { trpc } from '@/lib/trpc/client';
import { useRole } from '@/components/auth/useRole';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useToast } from '@/components/ui/toast/ToastProvider';
import { cn } from '@/lib/cn';

type Transform = 'circumferenceToDbh' | 'yearToDate' | '';
type ColMap = { target: string; transform: Transform };

const STANDARD_TARGETS: { value: string; key: string }[] = [
  { value: 'commonName', key: 'field.commonName' },
  { value: 'scientificName', key: 'field.scientificName' },
  { value: 'health', key: 'field.health' },
  { value: 'condition', key: 'field.condition' },
  { value: 'risk', key: 'field.risk' },
  { value: 'dbhCm', key: 'field.dbh' },
  { value: 'heightM', key: 'field.height' },
  { value: 'canopyRadiusM', key: 'field.canopy' },
  { value: 'estimatedAgeYears', key: 'field.age' },
  { value: 'plantedDate', key: 'field.planted' },
  { value: 'nextInspectionOn', key: 'field.nextDue' },
  { value: 'treeNo', key: 'field.treeNo' },
  { value: 'notes', key: 'field.notes' },
];

/**
 * Project-settings card: map this project's custom fields onto standard fields,
 * save it, and apply it to the existing trees (backfill from custom_fields).
 * Also toggles per-project auto-numbering of new trees. Admin only.
 */
export function ImportMappingManager() {
  const { can } = useRole();
  const t = useT();
  const toast = useToast();
  const utils = trpc.useUtils();
  const { data: defs = [] } = trpc.customFields.list.useQuery();
  const { data: saved } = trpc.imports.mapping.useQuery();

  const [cols, setCols] = useState<Record<string, ColMap>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready || defs.length === 0) return;
    const init: Record<string, ColMap> = {};
    for (const d of defs) {
      const s = saved?.columns?.[d.key];
      init[d.key] = s ? { target: s.target, transform: s.transform ?? '' } : { target: 'ignore', transform: '' };
    }
    setCols(init);
    setReady(true);
  }, [defs, saved, ready]);

  const saveMapping = trpc.imports.setMapping.useMutation({
    onSuccess: () => utils.imports.mapping.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const remap = trpc.imports.remapExisting.useMutation({
    onSuccess: (r) => {
      utils.trees.list.invalidate();
      toast.success(t('import.updated', { count: r.updated }));
    },
    onError: (e) => toast.error(e.message),
  });
  if (!can('admin')) return null;

  const buildMapping = () => ({
    lngColumn: saved?.lngColumn ?? null,
    latColumn: saved?.latColumn ?? null,
    columns: Object.fromEntries(
      Object.entries(cols).map(([k, m]) => [k, { target: m.target, transform: m.transform || undefined }]),
    ),
  });

  return (
    <section className="rounded-lg p-4 hairline bg-panel/40">
      <h2 className="text-sm font-semibold text-ink">{t('import.fieldMapping')}</h2>
      <p className="mt-1 text-xs text-muted">{t('import.fieldMappingDesc')}</p>

      {defs.length > 0 ? (
        <div className="mt-3 max-h-72 overflow-y-auto rounded-lg hairline">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-panel text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">{t('import.column')}</th>
                <th className="px-3 py-2 text-left font-medium">{t('import.target')}</th>
                <th className="px-3 py-2 text-left font-medium">{t('import.transform')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {defs.map((d) => (
                <tr key={d.key}>
                  <td className="px-3 py-1.5 text-ink">{d.label}</td>
                  <td className="px-3 py-1.5">
                    <select
                      className={cn(inputBase, 'h-8')}
                      value={cols[d.key]?.target ?? 'ignore'}
                      onChange={(e) => setCols((s) => ({ ...s, [d.key]: { target: e.target.value, transform: s[d.key]?.transform ?? '' } }))}
                    >
                      <option value="ignore">{t('import.ignore')}</option>
                      <option value="custom">{t('import.custom')}</option>
                      {STANDARD_TARGETS.map((o) => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      className={cn(inputBase, 'h-8')}
                      value={cols[d.key]?.transform ?? ''}
                      onChange={(e) => setCols((s) => ({ ...s, [d.key]: { target: s[d.key]?.target ?? 'ignore', transform: e.target.value as Transform } }))}
                    >
                      <option value="">{t('import.transformNone')}</option>
                      <option value="circumferenceToDbh">{t('import.transformCirc')}</option>
                      <option value="yearToDate">{t('import.transformYear')}</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted">{t('cf.none')}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => saveMapping.mutate(buildMapping())} disabled={saveMapping.isPending}>
          {saveMapping.isPending ? t('common.saving') : t('mapping.save')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            await saveMapping.mutateAsync(buildMapping()); // remap reads the saved mapping
            remap.mutate();
          }}
          disabled={remap.isPending || saveMapping.isPending}
        >
          {remap.isPending ? t('import.applying') : t('import.applyExisting')}
        </Button>
      </div>
    </section>
  );
}
