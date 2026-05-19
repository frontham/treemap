import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/server/trpc/root';

/**
 * Vanilla (non-React) tRPC client for code that runs outside of components —
 * mostly the offline sync worker, which can't use React Query hooks.
 */
export const vanillaTrpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
    }),
  ],
});
