'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/Button';
import { inputBase } from '@/components/forms/fields/FieldShell';
import { cn } from '@/lib/cn';
import { useRole } from '@/components/auth/useRole';
import type { CustomFieldDefView } from '@/server/trpc/routers/customFields';

const TYPES = ['text', 'number', 'boolean', 'select', 'multiselect', 'date'] as const;
type FType = (typeof TYPES)[number];

const hasOptions = (t: FType) => t === 'select' || t === 'multiselect';
const parseOptions = (s: string) =>
  s
    .split(/[\n,]/)
    .map((x) => x.trim())
    .filter(Boolean);

/** Per-project custom field schema editor. Read-only for non-admins. */
export function CustomFieldsManager() {
  const { can } = useRole();
  const canEdit = can('admin');
  const utils = trpc.useUtils();
  const { data: fields = [], error, isLoading } = trpc.customFields.list.useQuery();
  const invalidate = () => utils.customFields.list.invalidate();

  if (error) {
    return <p className="text-sm text-muted">You need project-admin access to view fields.</p>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">
          Fields {fields.length ? `(${fields.length})` : ''}
        </h2>
        {isLoading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : fields.length === 0 ? (
          <p className="text-sm text-muted">No custom fields for this project yet.</p>
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

function FieldRow({
  def,
  canEdit,
  onChanged,
}: {
  def: CustomFieldDefView;
  canEdit: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(def.label);
  const [required, setRequired] = useState(def.required);
  const [order, setOrder] = useState(def.displayOrder);
  const [optionsText, setOptionsText] = useState((def.options ?? []).join(', '));
  const showOptions = hasOptions(def.type as FType);

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
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger/10"
              onClick={() => {
                if (window.confirm(`Archive field "${def.label}"?`)) archive.mutate({ id: def.id });
              }}
            >
              Archive
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
        placeholder="Label"
      />
      {showOptions ? (
        <input
          className={inputBase}
          value={optionsText}
          onChange={(e) => setOptionsText(e.target.value)}
          placeholder="Options (comma separated)"
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
          Required
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          Order
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
          {update.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </li>
  );
}

function AddFieldForm({ nextOrder, onChanged }: { nextOrder: number; onChanged: () => void }) {
  const [key, setKey] = useState('');
  const [labelText, setLabelText] = useState('');
  const [type, setType] = useState<FType>('text');
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
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted">Add field</h2>
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
          placeholder="key (a-z, 0-9, _)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <input
          className={inputBase}
          required
          placeholder="Label"
          value={labelText}
          onChange={(e) => setLabelText(e.target.value)}
        />
        <select
          className={inputBase}
          value={type}
          onChange={(e) => setType(e.target.value as FType)}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {showOptions ? (
          <input
            className={inputBase}
            placeholder="Options (comma separated)"
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
            {create.isPending ? 'Adding…' : 'Add field'}
          </Button>
        </div>
      </form>
    </section>
  );
}
