'use client';

import { trpc } from '@/lib/trpc/client';
import { useRole } from '@/components/auth/useRole';
import { useT } from '@/lib/i18n/LocaleProvider';
import { FieldRow } from './FieldRow';
import { AddFieldForm } from './AddFieldForm';

/** Per-project custom field schema editor. Read-only for non-admins. */
export function CustomFieldsManager() {
  const { can } = useRole();
  const t = useT();
  const canEdit = can('admin');
  const utils = trpc.useUtils();
  const { data: fields = [], error, isLoading } = trpc.customFields.list.useQuery();
  const invalidate = () => utils.customFields.list.invalidate();

  if (error) {
    return <p className="text-sm text-muted">{t('cf.noAccess')}</p>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">
          {t('cf.fields')} {fields.length ? `(${fields.length})` : ''}
        </h2>
        {isLoading ? (
          <p className="text-sm text-muted">{t('common.loading')}</p>
        ) : fields.length === 0 ? (
          <p className="text-sm text-muted">{t('cf.none')}</p>
        ) : (
          <ul className="divide-y divide-hairline rounded-lg bg-panel hairline">
            {fields.map((f) => (
              <FieldRow key={f.id} def={f} canEdit={canEdit} onChanged={invalidate} />
            ))}
          </ul>
        )}
      </section>

      {canEdit ? <AddFieldForm nextOrder={(fields.length + 1) * 10} onChanged={invalidate} /> : null}
    </div>
  );
}
