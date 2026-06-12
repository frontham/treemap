import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { del, get, set } from 'idb-keyval';
import type { Query } from '@tanstack/react-query';

/**
 * Which tRPC queries survive a reload (IndexedDB) so the field user still sees
 * their trees without a connection. Deliberately an allowlist: photo renditions
 * and overlay images are data URLs (MBs) and would blow the storage budget —
 * those stay network-only until the R2 migration.
 */
const PERSISTED_QUERIES = new Set([
  'auth.me',
  'projects.list',
  'customFields.list',
  'trees.list',
  'trees.get',
  'inspections.list',
]);

/** Keep persisted entries (and the in-memory cache backing them) for a week. */
export const PERSIST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Bump to invalidate every persisted cache after a breaking shape change. */
export const PERSIST_BUSTER = 'v1';

export function shouldPersistQuery(query: Query): boolean {
  if (query.state.status !== 'success') return false;
  const path = Array.isArray(query.queryKey[0]) ? (query.queryKey[0] as unknown[]).join('.') : '';
  return PERSISTED_QUERIES.has(path);
}

/**
 * IndexedDB-backed persister for the React Query cache (localStorage is too
 * small once tree details are cached). The server gets a no-op storage — the
 * provider only persists/restores on the client.
 */
export function createQueryPersister() {
  const storage =
    typeof window === 'undefined'
      ? {
          getItem: async () => null,
          setItem: async () => {},
          removeItem: async () => {},
        }
      : {
          getItem: (key: string) => get<string>(key).then((v) => v ?? null),
          setItem: (key: string, value: string) => set(key, value),
          removeItem: (key: string) => del(key),
        };
  return createAsyncStoragePersister({
    storage,
    key: 'treemap:query-cache:v1',
    throttleTime: 2_000,
  });
}
