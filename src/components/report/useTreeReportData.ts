'use client';

import { useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useDateFormatter } from '@/lib/i18n/useDateFormatter';
import type { TreePhotoView } from '@/components/trees/TreeView';

export type PhotoGroup = { id: string; label: string; photos: TreePhotoView[] };
/** A selected photo flattened out of its group, keeping the group label for the caption. */
export type PrintPhoto = TreePhotoView & { groupLabel: string };

/** The report's data needs: the tree, its inspections, and supporting lookups. */
export function useTreeReportData(treeId: string, projectSlug: string) {
  const t = useT();
  const fmtDate = useDateFormatter();

  const treeQ = trpc.trees.get.useQuery({ id: treeId }, { retry: false });
  const inspectionsQ = trpc.inspections.list.useQuery({ treeId }, { retry: false });
  const { data: defs = [] } = trpc.customFields.list.useQuery();
  const { data: projects = [] } = trpc.projects.list.useQuery();

  const tree = treeQ.data;
  const inspections = inspectionsQ.data;
  const projectName = projects.find((p) => p.slug === projectSlug)?.name ?? projectSlug;
  const labelFor = (key: string) => defs.find((d) => d.key === key)?.label ?? key;

  // All selectable photos, grouped by where they live (tree vs. inspection).
  const photoGroups = useMemo<PhotoGroup[]>(() => {
    const groups: PhotoGroup[] = [];
    if (tree?.photos.length) {
      groups.push({ id: 'general', label: t('report.photosGeneral'), photos: tree.photos });
    }
    for (const i of inspections ?? []) {
      if (i.photos.length) {
        groups.push({
          id: i.id,
          label: t('report.photosInspection', { date: fmtDate(i.inspectedOn) ?? '' }),
          photos: i.photos,
        });
      }
    }
    return groups;
  }, [tree, inspections, t, fmtDate]);

  return {
    tree,
    inspections,
    error: !!(treeQ.error || inspectionsQ.error),
    projectName,
    labelFor,
    photoGroups,
  };
}
