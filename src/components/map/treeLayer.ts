import type { Map, CircleLayerSpecification } from 'maplibre-gl';
import { colors } from '@/styles/tokens';
import { pinColorExpression } from './pinColor';

export const TREES_SOURCE = 'trees';
export const TREES_PIN_LAYER = 'trees-pins';
export const TREES_CLUSTER_LAYER = 'trees-clusters';
export const TREES_CLUSTER_COUNT_LAYER = 'trees-cluster-count';

export const PENDING_SOURCE = 'pending-trees';
export const PENDING_LAYER = 'pending-trees-pins';

/** Opacity for dead trees when the user picks the "dim" display mode. */
export const DEAD_DIM_OPACITY = 0.35;

/**
 * Orange "highlight" pin styling, shared by the selected-tree highlighter and
 * the search-match highlighter so a matched pin reads exactly like a selected one.
 */
export const HIGHLIGHT_PIN_PAINT: CircleLayerSpecification['paint'] = {
  'circle-color': '#f97316',
  'circle-stroke-color': '#FFFFFF',
  'circle-stroke-width': 2.5,
  'circle-radius': 8,
};

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
    // Colored by an attribute (default: health) — green/amber/red, dark = unknown.
    // TreesLoader swaps circle-color when the user picks a different attribute
    // (see pinColorExpression). The selected tree is highlighted separately by
    // SelectedTreeHighlighter (orange overlay on top).
    paint: {
      'circle-color': pinColorExpression('health'),
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
