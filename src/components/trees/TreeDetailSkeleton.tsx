/** Quiet skeleton shown while trpc.trees.get is in flight. */
export function TreeDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="animate-pulse space-y-2">
        <div className="h-5 w-2/3 rounded bg-panel" />
        <div className="h-4 w-1/2 rounded bg-panel" />
      </div>
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-6">
            <div className="h-3 w-14 rounded bg-panel" />
            <div className="h-3 w-24 rounded bg-panel" />
          </div>
        ))}
      </div>
    </div>
  );
}
