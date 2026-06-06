import Link from 'next/link';
import type { Route } from 'next';
import { CustomFieldsManager } from '@/components/customFields/CustomFieldsManager';
import { ProjectAdminActions } from '@/components/projects/ProjectAdminActions';

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}) {
  const { slug, projectSlug } = await params;
  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-10">
        <div>
          <Link
            href={`/orgs/${slug}/projects/${projectSlug}/map` as Route}
            className="text-sm text-accent hover:underline"
          >
            ← Back to map
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-ink">Project settings</h1>
        </div>
        <CustomFieldsManager />
        <ProjectAdminActions />
      </div>
    </main>
  );
}
