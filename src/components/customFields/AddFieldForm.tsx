'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/Button';
import { inputBase } from '@/components/forms/fields/FieldShell';
import { useT } from '@/lib/i18n/LocaleProvider';
import { FIELD_TYPES, hasOptions, parseOptions, type FieldType } from './fieldTypes';

/** Admin form to add a custom field definition to the active project. */
export function AddFieldForm({ nextOrder, onChanged }: { nextOrder: number; onChanged: () => void }) {
  const t = useT();
  const [key, setKey] = useState('');
  const [labelText, setLabelText] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [optionsText, setOptionsText] = useState('');
  const create = trpc.customFields.create.useMutation({
    onSuccess: () => {
      onChanged();
      setKey('');
      setLabelText('');
      setType('text');
      setOptionsText('');
    },
  });
  const showOptions = hasOptions(type);

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">
        {t('cf.addField')}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({
            key: key.trim(),
            label: labelText.trim(),
            type,
            options: showOptions ? parseOptions(optionsText) : null,
            required: false,
            displayOrder: nextOrder,
          });
        }}
        className="grid grid-cols-1 gap-3 rounded-lg bg-panel p-4 hairline sm:grid-cols-2"
      >
        <input
          className={inputBase}
          required
          placeholder={t('cf.key')}
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <input
          className={inputBase}
          required
          placeholder={t('cf.label')}
          value={labelText}
          onChange={(e) => setLabelText(e.target.value)}
        />
        <select
          className={inputBase}
          value={type}
          onChange={(e) => setType(e.target.value as FieldType)}
        >
          {FIELD_TYPES.map((ft) => (
            <option key={ft} value={ft}>
              {ft}
            </option>
          ))}
        </select>
        {showOptions ? (
          <input
            className={inputBase}
            placeholder={t('cf.options')}
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
          />
        ) : (
          <div className="hidden sm:block" />
        )}
        {create.error ? (
          <p className="text-sm text-danger sm:col-span-2">{create.error.message}</p>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? t('cf.adding') : t('cf.addField')}
          </Button>
        </div>
      </form>
    </section>
  );
}
