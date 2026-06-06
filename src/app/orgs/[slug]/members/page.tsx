import Link from 'next/link';
import type { Route } from 'next';
import { OrgMembersManager } from '@/components/members/OrgMembersManager';

export default async function MembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="mx-auto mb-6 w-full max-w-2xl">
        <Link href={`/orgs/${slug}` as Route} className="text-sm text-accent hover:underline">
          ← Projects
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink">Organization members</h1>
      </div>
      <OrgMembersManager />
    </main>
  );
}
