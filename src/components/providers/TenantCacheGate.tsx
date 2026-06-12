'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useIsRestoring, useQueryClient } from '@tanstack/react-query';

/**
 * Clears the React Query cache when the active tenant changes.
 *
 * Tenant-scoped queries (trees.list, customFields.list, …) carry NO org/project
 * in their query key — the server resolves the tenant from cookies. That makes
 * the whole query cache implicitly single-tenant: after switching org/project,
 * every cached entry belongs to the WRONG tenant and (being fresh within
 * staleTime) would be served without a refetch — stale pins on the map, 404s
 * when opening them.
 *
 * Children are withheld until the check has run, so queries can't mount
 * against the old tenant's cache. `useIsRestoring` keeps this correct if the
 * cache is ever persisted (the check must run after restore, not before).
 */
export function TenantCacheGate({
  storageKey,
  tenant,
  children,
}: {
  /** Distinct per gate level (org vs project) so nested gates don't fight. */
  storageKey: string;
  tenant: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const isRestoring = useIsRestoring();
  const [clearedFor, setClearedFor] = useState<string | null>(null);

  useEffect(() => {
    if (isRestoring) return;
    const key = `treemap:last-tenant:${storageKey}`;
    const prev = window.localStorage.getItem(key);
    if (prev !== null && prev !== tenant) queryClient.clear();
    window.localStorage.setItem(key, tenant);
    setClearedFor(tenant);
  }, [isRestoring, storageKey, tenant, queryClient]);

  if (clearedFor !== tenant) return null;
  return <>{children}</>;
}
