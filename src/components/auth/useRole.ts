'use client';

import { trpc } from '@/lib/trpc/client';

export type Role = 'owner' | 'admin' | 'editor' | 'viewer';

const RANK: Record<Role, number> = { viewer: 0, editor: 1, admin: 2, owner: 3 };

/**
 * Reads the current session (user + active org + active project + effective
 * role) and exposes role checks. Backed by trpc.auth.me — React Query dedupes
 * the request across every component that calls this.
 */
export function useRole() {
  const { data: me, isLoading } = trpc.auth.me.useQuery();
  const role = me?.project?.role as Role | undefined;
  const orgRole = me?.org?.role as Role | undefined;
  return {
    me,
    isLoading,
    role,
    can: (min: Role) => !!role && RANK[role] >= RANK[min],
    isOrgAdmin: !!orgRole && RANK[orgRole] >= RANK.admin,
  };
}
