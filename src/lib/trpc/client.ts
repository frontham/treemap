import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/trpc/root';

/**
 * The end-to-end typed tRPC client. Every router method on the server becomes
 * a fully-typed `trpc.<path>.useQuery()` / `useMutation()` hook on the client.
 */
export const trpc = createTRPCReact<AppRouter>();
