import type { ReactNode } from 'react';
import { TenantCacheGate } from '@/components/providers/TenantCacheGate';

/** Resets the (cookie-tenanted) query cache when the active project changes. */
export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string; projectSlug: string }>;
}) {
  const { slug, projectSlug } = await params;
  return (
    <TenantCacheGate storageKey="project" tenant={`${slug}/${projectSlug}`}>
      {children}
    </TenantCacheGate>
  );
}
