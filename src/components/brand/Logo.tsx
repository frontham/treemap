import { cn } from '@/lib/cn';

/**
 * TreeMap brand mark: a map pin (you-are-here) cradling a little tree, with
 * faint topographic contour lines behind and a terracotta "berry" for pop.
 * Pure SVG — safe in server or client components. Scales by `size`.
 */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="TreeMap"
      className={className}
    >
      {/* map contour lines */}
      <path d="M5 31q15 -7.5 30 0" stroke="#8AA3B0" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      <path d="M11 35.5q9 -4.5 18 0" stroke="#8AA3B0" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      {/* pin */}
      <path
        d="M20 37C20 37 31 24 31 15A11 11 0 1 0 9 15C9 24 20 37 20 37Z"
        fill="#FAFAF7"
        stroke="#0E1012"
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
      {/* tree: canopy + trunk */}
      <rect x="19" y="13.5" width="2" height="7" rx="1" fill="#7A2E07" />
      <circle cx="20" cy="13" r="5.2" fill="#8FA384" />
      {/* brand berry */}
      <circle cx="23.7" cy="10.6" r="1.7" fill="#E0530B" />
    </svg>
  );
}

/** Logo mark + "TreeMap" wordmark ("Map" in the brand accent). */
export function Wordmark({
  markSize = 38,
  className,
}: {
  markSize?: number;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={markSize} />
      <span className="text-xl font-semibold tracking-tight text-ink">
        Tree<span className="text-accent">Map</span>
      </span>
    </div>
  );
}
