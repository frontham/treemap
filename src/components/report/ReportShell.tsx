import Link from 'next/link';
import type { Route } from 'next';
import type { ReactNode } from 'react';

/** Centered fallback frame (loading / not found) with a way back to the map. */
export function ReportShell({
  orgSlug,
  projectSlug,
  children,
}: {
  orgSlug: string;
  projectSlug: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-panel">
      {children}
      <Link
        href={`/orgs/${orgSlug}/projects/${projectSlug}/map` as Route}
        className="text-sm text-accent hover:underline"
      >
        ← TreeMap
      </Link>
    </div>
  );
}
