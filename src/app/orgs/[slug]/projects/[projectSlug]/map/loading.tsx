import { Spinner } from '@/components/ui/Spinner';

export default function MapLoading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-panel">
      <span className="inline-flex items-center gap-2 rounded-full bg-paper px-3.5 py-2 text-sm text-muted hairline shadow-floating">
        <Spinner size={16} className="text-accent" />
        Loading map…
      </span>
    </div>
  );
}
