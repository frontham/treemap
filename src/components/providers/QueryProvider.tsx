'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { trpc } from '@/lib/trpc/client';
import {
  createQueryPersister,
  shouldPersistQuery,
  PERSIST_BUSTER,
  PERSIST_MAX_AGE_MS,
} from '@/lib/offline/queryPersister';
import { GlobalActivityBar } from './GlobalActivityBar';

/**
 * Single provider that wires the React Query client + the tRPC React client.
 * Both are created lazily so that during SSR every request gets its own pair.
 * The query cache is persisted to IndexedDB (allowlisted queries only — see
 * queryPersister) so previously loaded data survives an offline reload.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data on this app changes through this app — a freshly fetched
            // query doesn't need to refire when a drawer remounts or the tab
            // regains focus. Mutations invalidate what they touch.
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Keep entries in memory as long as they're persisted — a gcTime
            // below maxAge would silently drop them from the next persist.
            gcTime: PERSIST_MAX_AGE_MS,
          },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
        }),
      ],
    }),
  );
  const [persister] = useState(() => createQueryPersister());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: PERSIST_MAX_AGE_MS,
          buster: PERSIST_BUSTER,
          dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
        }}
      >
        <GlobalActivityBar />
        {children}
      </PersistQueryClientProvider>
    </trpc.Provider>
  );
}
