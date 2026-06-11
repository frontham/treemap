import Link from 'next/link';
import type { Route } from 'next';
import { CustomFieldsManager } from '@/components/customFields/CustomFieldsManager';
import { InspectionMappingManager } from '@/components/inspections/InspectionMappingManager';
import { ImportMappingManager } from '@/components/imports/ImportMappingManager';
import { ProjectDataActions } from '@/components/projects/ProjectDataActions';
import { ProjectAdminActions } from '@/components/projects/ProjectAdminActions';
import { getServerT } from '@/lib/i18n/server';

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}) {
  const { slug, projectSlug } = await params;
  const t = await getServerT();
  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-10">
        <div>
          <Link
            href={`/orgs/${slug}/projects/${projectSlug}/map` as Route}
            className="text-sm text-accent hover:underline"
          >
            {t('projects.backToMap')}
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-ink">{t('projects.settings')}</h1>
        </div>
        <CustomFieldsManager />
        <ProjectDataActions />
        <ImportMappingManager />
        <InspectionMappingManager />
        <ProjectAdminActions />
      </div>
    </main>
  );
}
