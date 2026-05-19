'use client';

type Props = { message: string };

export function MapErrorOverlay({ message }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-paper/80 backdrop-blur-sm">
      <div className="pointer-events-auto max-w-sm rounded-lg bg-panel hairline p-4 shadow-floating">
        <p className="text-sm font-medium text-danger">Map failed to load</p>
        <p className="mt-1 text-sm text-muted">{message}</p>
        <p className="mt-2 mono-num text-xs text-muted">
          check console · network · style URL
        </p>
      </div>
    </div>
  );
}
