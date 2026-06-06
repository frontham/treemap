import { FloatingTopBar } from '@/components/layout/FloatingTopBar';
import { FloatingControlCluster } from '@/components/layout/FloatingControlCluster';
import { MapShell } from '@/components/map/MapShell';
import { CursorCoordReadout } from '@/components/map/CursorCoordReadout';
import { TreesLoader } from '@/components/map/TreesLoader';
import { MapInitialView } from '@/components/map/MapInitialView';
import { OverlaysLoader } from '@/components/map/OverlaysLoader';
import { TreeSelectHandler } from '@/components/map/TreeSelectHandler';
import { ComposeBanner } from '@/components/map/ComposeBanner';
import { ComposeMapHandler } from '@/components/map/ComposeMapHandler';
import { DraftPinLayer } from '@/components/map/DraftPinLayer';
import { PendingTreesLoader } from '@/components/map/PendingTreesLoader';
import { CalibratePanel } from '@/components/map/CalibratePanel';
import { AlignByPoints } from '@/components/map/AlignByPoints';
import { ReferenceImageTool } from '@/components/map/ReferenceImageTool';
import { TreeDetailDrawer } from '@/components/trees/TreeDetailDrawer';
import { TreeComposerDrawer } from '@/components/trees/TreeComposerDrawer';

/**
 * Project map. The active org + project are pinned to cookies by middleware
 * (from these URL slugs), so every tRPC query/mutation resolves to this
 * project. Data loaders take no project arg — the server scopes by the cookie.
 */
export default function ProjectMapPage() {
  return (
    <MapShell initialCenter={{ lng: 4.4634, lat: 52.1741 }} initialZoom={15}>
      <FloatingTopBar />
      <CursorCoordReadout />
      <FloatingControlCluster />
      <ComposeBanner />
      <ComposeMapHandler />
      <DraftPinLayer />
      <TreesLoader />
      <CalibratePanel />
      <AlignByPoints />
      <ReferenceImageTool />
      <MapInitialView />
      <PendingTreesLoader />
      <OverlaysLoader />
      <TreeSelectHandler />
      <TreeDetailDrawer />
      <TreeComposerDrawer />
    </MapShell>
  );
}
