import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-paper text-ink">
      <div className="text-center space-y-4">
        <h1 className="text-xl font-medium tracking-tight">TreeMap</h1>
        <p className="text-muted">Document trees on the map.</p>
        <Link
          href="/orgs/demo/map"
          className="inline-block text-accent hover:underline"
        >
          Open demo map →
        </Link>
      </div>
    </main>
  );
}
