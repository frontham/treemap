import type { Map } from 'maplibre-gl';
import { colors } from '@/styles/tokens';

export const TREES_SOURCE = 'trees';
export const TREES_PIN_LAYER = 'trees-pins';
export const TREES_CLUSTER_LAYER = 'trees-clusters';
export const TREES_CLUSTER_COUNT_LAYER = 'trees-cluster-count';

export const PENDING_SOURCE = 'pending-trees';
export const PENDING_LAYER = 'pending-trees-pins';

/**
 * Registers the GeoJSON source and three layers used to render tree pins:
 *   - clustered chip       (when zoomed out)
 *   - cluster count label  (text inside the chip)
 *   - individual pin       (when zoomed in)
 *
 * The source starts empty; populate it via map.getSource(TREES_SOURCE).setData(...).
 */
export function addTreeLayer(map: Map) {
  if (map.getSource(TREES_SOURCE)) return;

  map.addSource(TREES_SOURCE, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    cluster: true,
    clusterRadius: 40,
    clusterMaxZoom: 12,
  });

  map.addLayer({
    id: TREES_CLUSTER_LAYER,
    type: 'circle',
    source: TREES_SOURCE,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': colors.panel,
      'circle-stroke-color': colors.hairline,
      'circle-stroke-width': 1,
      'circle-radius': ['step', ['get', 'point_count'], 14, 25, 18, 100, 22],
    },
  });

  map.addLayer({
    id: TREES_CLUSTER_COUNT_LAYER,
    type: 'symbol',
    source: TREES_SOURCE,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
    },
    paint: { 'text-color': colors.ink },
  });

  map.addLayer({
    id: TREES_PIN_LAYER,
    type: 'circle',
    source: TREES_SOURCE,
    filter: ['!', ['has', 'point_count']],
    // Colored by health (muted, matching the Details-tab dot): green = healthy,
    // amber = fair/poor, red = dead, dark = unknown/default. The selected tree is
    // highlighted separately by SelectedTreeHighlighter (orange overlay on top).
    paint: {
      'circle-color': [
        'match',
        ['get', 'health'],
        'healthy',
        colors.sage,
        ['fair', 'poor'],
        colors.warn,
        'dead',
        colors.danger,
        '#3F4248',
      ],
      'circle-stroke-color': '#FFFFFF',
      'circle-stroke-width': 2,
      'circle-radius': 6,
    },
  });

  // Pending (unsynced) trees — translucent accent so they read as "not yet saved".
  map.addSource(PENDING_SOURCE, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
  map.addLayer({
    id: PENDING_LAYER,
    type: 'circle',
    source: PENDING_SOURCE,
    paint: {
      'circle-color': colors.accent,
      'circle-opacity': 0.4,
      'circle-stroke-color': colors.accent,
      'circle-stroke-width': 2,
      'circle-radius': 7,
    },
  });
}
