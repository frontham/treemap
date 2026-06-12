'use client';

import { TRPCClientError } from '@trpc/client';
import { Drawer } from '@/components/ui/Drawer';
import { useCompose } from '@/components/map/ComposeContext';
import { TreeForm } from '@/components/forms/TreeForm';
import { trpc } from '@/lib/trpc/client';
import { enqueue } from '@/lib/offline/queue';
import { useToast } from '@/components/ui/toast/ToastProvider';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { TreeFormValues } from '@/components/forms/parseTreeFormData';

/**
 * Drawer that hosts the TreeForm when the user has placed a draft pin.
 * On network failure the create payload is enqueued for later sync, so the
 * "Save" interaction always succeeds locally — the offline indicator
 * surfaces the count and OfflineProvider drains it on reconnect. A response
 * the server actively rejected (validation, permissions) is NOT queued:
 * retrying it would fail forever and block the queue behind it.
 */
export function TreeComposerDrawer() {
  const t = useT();
  const toast = useToast();
  const { mode, draft, source, accuracyM, cancel } = useCompose();
  const utils = trpc.useUtils();
  const { data: me } = trpc.auth.me.useQuery();
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
      placedVia: source,
      locationAccuracyM: accuracyM,
      ...values,
    };
    try {
      await createTree.mutateAsync(payload);
    } catch (e) {
      // `data` present = the server processed and rejected the call — surface
      // it. Absent = the request never got through — queue for later sync,
      // pinned to the active project so it can't drain into another one.
      if (e instanceof TRPCClientError && e.data) {
        toast.error(t('tree.createFailed', { message: e.message }));
        return; // keep the drawer open so the input isn't lost
      }
      enqueue({ kind: 'trees.create', payload, projectId: me?.project?.id });
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
