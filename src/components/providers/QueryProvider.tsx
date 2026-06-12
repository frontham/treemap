'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { trpc } from '@/lib/trpc/client';
import { GlobalActivityBar } from './GlobalActivityBar';

/**
 * Single provider that wires the React Query client + the tRPC React client.
 * Both are created lazily so that during SSR every request gets its own pair.
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

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GlobalActivityBar />
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
