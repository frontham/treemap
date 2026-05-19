'use client';

import { useEffect } from 'react';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import { useMap } from './MapContext';
import { useSelection } from './SelectionContext';
import { useCompose } from './ComposeContext';
import { TREES_PIN_LAYER } from './treeLayer';

/**
 * Binds click + cursor behavior to the tree pin layer:
 *   - click pin   → store the tree's id in selection (the drawer fetches it)
 *   - hover pin   → cursor turns into a pointer
 * Disabled while compose is active so a click can't both place + select.
 */
export function TreeSelectHandler() {
  const { map } = useMap();
  const { select } = useSelection();
  const { mode } = useCompose();

  useEffect(() => {
    if (!map || mode !== 'idle') return;

    const onClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const id = (feature.properties as { id?: string } | null)?.id;
      if (id) select(id);
    };

    const enter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const leave = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', TREES_PIN_LAYER, onClick);
    map.on('mouseenter', TREES_PIN_LAYER, enter);
    map.on('mouseleave', TREES_PIN_LAYER, leave);

    return () => {
      map.off('click', TREES_PIN_LAYER, onClick);
      map.off('mouseenter', TREES_PIN_LAYER, enter);
      map.off('mouseleave', TREES_PIN_LAYER, leave);
    };
  }, [map, mode, select]);

  return null;
}
