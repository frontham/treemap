'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/Button';
import { inputBase } from '@/components/forms/fields/FieldShell';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { CustomFieldDefView } from '@/server/trpc/routers/customFields';
import { hasOptions, parseOptions, type FieldType } from './fieldTypes';

/** One field definition: read row with edit/archive, or its inline edit form. */
export function FieldRow({
  def,
  canEdit,
  onChanged,
}: {
  def: CustomFieldDefView;
  canEdit: boolean;
  onChanged: () => void;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(def.label);
  const [required, setRequired] = useState(def.required);
  const [order, setOrder] = useState(def.displayOrder);
  const [optionsText, setOptionsText] = useState((def.options ?? []).join(', '));
  const showOptions = hasOptions(def.type as FieldType);

  const update = trpc.customFields.update.useMutation({
    onSuccess: () => {
      onChanged();
      setEditing(false);
    },
  });
  const archive = trpc.customFields.archive.useMutation({ onSuccess: onChanged });

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-ink">
            {def.label}
            {def.required ? <span className="text-danger"> *</span> : null}
          </p>
          <p className="truncate text-xs text-muted">
            <span className="mono-num">{def.key}</span> · {def.type}
            {showOptions && def.options?.length ? ` · ${def.options.join(', ')}` : ''}
          </p>
        </div>
        {canEdit ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              {t('common.edit')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger/10"
              onClick={() => {
                if (window.confirm(`Archive field "${def.label}"?`)) archive.mutate({ id: def.id });
              }}
            >
              {t('cf.archive')}
            </Button>
          </div>
        ) : null}
      </li>
    );
  }

  return (
    <li className="space-y-2 px-4 py-3">
      <input
        className={inputBase}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={t('cf.label')}
      />
      {showOptions ? (
        <input
          className={inputBase}
          value={optionsText}
          onChange={(e) => setOptionsText(e.target.value)}
          placeholder={t('cf.options')}
        />
      ) : null}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="h-4 w-4 rounded border-hairline text-accent focus:ring-accent"
          />
          {t('cf.required')}
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          {t('cf.order')}
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className={cn(inputBase, 'h-8 w-20')}
          />
        </label>
      </div>
      {update.error ? <p className="text-sm text-danger">{update.error.message}</p> : null}
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({
              id: def.id,
              label: label.trim(),
              options: showOptions ? parseOptions(optionsText) : null,
              required,
              displayOrder: order,
            })
          }
        >
          {update.isPending ? t('common.saving') : t('common.save')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
          {t('common.cancel')}
        </Button>
      </div>
    </li>
  );
}
