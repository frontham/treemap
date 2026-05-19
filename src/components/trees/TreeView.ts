export type TreePhotoView = {
  id: string;
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
  dbhCm?: number;
  heightM?: number;
  canopyRadiusM?: number;
  estimatedAgeYears?: number;
  plantedDate?: string;
  notes?: string;
  customFields: Record<string, unknown>;
  location: { lng: number; lat: number };
  photos: TreePhotoView[];
};
