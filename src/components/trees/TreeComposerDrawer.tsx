'use client';

import { Drawer } from '@/components/ui/Drawer';
import { useCompose } from '@/components/map/ComposeContext';
import { TreeForm } from '@/components/forms/TreeForm';
import { trpc } from '@/lib/trpc/client';
import { enqueue } from '@/lib/offline/queue';
import type { TreeFormValues } from '@/components/forms/parseTreeFormData';

/**
 * Drawer that hosts the TreeForm when the user has placed a draft pin.
 * On network failure the create payload is enqueued for later sync, so the
 * "Save" interaction always succeeds locally — the offline indicator
 * surfaces the count and OfflineProvider drains it on reconnect.
 */
export function TreeComposerDrawer() {
  const { mode, draft, cancel } = useCompose();
  const utils = trpc.useUtils();
  const createTree = trpc.trees.create.useMutation({
    // 'always' so the request actually fires (and fails) when offline, instead
    // of React Query pausing it — that's what hands control to our queue.
    networkMode: 'always',
    onSuccess: () => utils.trees.list.invalidate(),
  });
  const open = mode === 'editing' && !!draft;

  const handleSubmit = async (values: TreeFormValues) => {
    if (!draft) return;
    const payload = {
      location: draft,
      placedVia: 'map_click' as const,
      ...values,
    };
    try {
      await createTree.mutateAsync(payload);
    } catch {
      enqueue({ kind: 'trees.create', payload });
    }
    cancel();
  };

  return (
    <Drawer open={open} onClose={cancel}>
      {open && draft ? (
        <TreeForm location={draft} onSubmit={handleSubmit} onCancel={cancel} />
      ) : null}
    </Drawer>
  );
}
