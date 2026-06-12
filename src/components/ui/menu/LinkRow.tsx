import Link from 'next/link';
import type { Route } from 'next';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

const rowClass = 'block px-3 py-2.5 text-sm text-ink transition-colors hover:bg-panel';

/** Plain-anchor menu row (e.g. file downloads — `download` is preset). */
export function LinkRow(props: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  return <a download {...props} className={rowClass} />;
}

/** In-app navigation menu row (typed Next.js route). */
export function LinkRoute({
  href,
  onClick,
  children,
}: {
  href: Route;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Link href={href} onClick={onClick} className={rowClass}>
      {children}
    </Link>
  );
}
