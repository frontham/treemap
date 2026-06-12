import { LogoMark } from '@/components/brand/Logo';

/**
 * Offline fallback, served by the service worker for navigations that miss
 * both network and cache. Statically generated so it can be precached —
 * which is also why the copy is hardcoded bilingual rather than reading the
 * locale cookie (that would make the route dynamic).
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <LogoMark size={56} />
      <h1 className="text-xl font-semibold tracking-tight text-ink">You’re offline</h1>
      <p className="max-w-sm text-sm text-muted">
        This page isn’t available without a connection. Pages you’ve visited before keep working —
        try going back, or reconnect and try again.
      </p>
      <p className="max-w-sm text-sm text-muted">
        Je bent offline. Eerder bezochte pagina’s blijven werken — ga terug, of probeer het opnieuw
        zodra je verbinding hebt.
      </p>
    </main>
  );
}
