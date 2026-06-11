import { TreeReport } from '@/components/report/TreeReport';

/**
 * Printable per-tree report (tree facts, inspections, photos, map snapshots) —
 * e.g. to attach to a municipal permit application. Middleware pins the org +
 * project cookies from this URL, so the tRPC hooks inside resolve to the right
 * tenant just like on the map page.
 */
export default async function TreeReportPage({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string; treeId: string }>;
}) {
  const { slug, projectSlug, treeId } = await params;
  return <TreeReport orgSlug={slug} projectSlug={projectSlug} treeId={treeId} />;
}
