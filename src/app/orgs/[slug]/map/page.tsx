import { FloatingTopBar } from '@/components/layout/FloatingTopBar';
import { FloatingControlCluster } from '@/components/layout/FloatingControlCluster';
import { MapShell } from '@/components/map/MapShell';
import { CursorCoordReadout } from '@/components/map/CursorCoordReadout';
import { TreesLoader } from '@/components/map/TreesLoader';
import { OverlaysLoader } from '@/components/map/OverlaysLoader';
import { TreeSelectHandler } from '@/components/map/TreeSelectHandler';
import { ComposeBanner } from '@/components/map/ComposeBanner';
import { ComposeMapHandler } from '@/components/map/ComposeMapHandler';
import { DraftPinLayer } from '@/components/map/DraftPinLayer';
import { PendingTreesLoader } from '@/components/map/PendingTreesLoader';
import { TreeDetailDrawer } from '@/components/trees/TreeDetailDrawer';
import { TreeComposerDrawer } from '@/components/trees/TreeComposerDrawer';
import { humanizeSlug } from '@/lib/humanizeSlug';

type RouteParams = Promise<{ slug: string }>;

export default async function MapPage({ params }: { params: RouteParams }) {
  const { slug } = await params;
  const orgName = humanizeSlug(slug);

  return (
    <MapShell initialCenter={{ lng: -2.9916, lat: 53.4084 }} initialZoom={13}>
      <FloatingTopBar orgName={orgName} />
      <CursorCoordReadout />
      <FloatingControlCluster />
      <ComposeBanner />
      <ComposeMapHandler />
      <DraftPinLayer />
      <TreesLoader />
      <PendingTreesLoader />
      <OverlaysLoader />
      <TreeSelectHandler />
      <TreeDetailDrawer />
      <TreeComposerDrawer />
    </MapShell>
  );
}
