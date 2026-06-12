import type { ReactNode } from 'react';
import { TenantCacheGate } from '@/components/providers/TenantCacheGate';

/** Resets the (cookie-tenanted) query cache when the active org changes. */
export default async function OrgLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <TenantCacheGate storageKey="org" tenant={slug}>
      {children}
    </TenantCacheGate>
  );
}
