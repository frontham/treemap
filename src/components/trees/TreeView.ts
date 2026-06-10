export type TreePhotoView = {
  id: string;
  /** Small JPEG data URL shown in the strip; falls back to the full image. */
  thumbnailUrl?: string;
  caption?: string;
};

/**
 * The shape consumed by the read-only tree views (drawer, popovers, list).
 * Decoupled from the DB row so the same components can render demo data,
 * cached client data, or live server-loaded data.
 */
export type TreeView = {
  id: string;
  scientificName?: string;
  commonName: string;
  health?: string;
  condition?: string;
  risk?: string;
  nextInspectionOn?: string;
  treeNo?: number;
  dbhCm?: number;
  heightM?: number;
  canopyRadiusM?: number;
  estimatedAgeYears?: number;
  plantedDate?: string;
  notes?: string;
  customFields: Record<string, unknown>;
  location: { lng: number; lat: number };
  /** Date of the most recent inspection (YYYY-MM-DD), if any. */
  lastInspectedOn?: string;
  /** General (unlinked) tree photos. */
  photos: TreePhotoView[];
  /**
   * The inspection the tree's current values mirror (latest by date, then
   * recency) and its evidence photos — surfaced read-only on Details so the
   * snapshot's data and its supporting photos stay together. Absent if the tree
   * has no inspections.
   */
  latestInspection?: {
    id: string;
    inspectedOn: string;
    photos: TreePhotoView[];
  };
};
