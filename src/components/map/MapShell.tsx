'use client';

import { useRef, type ReactNode } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapContext, type Cursor } from './MapContext';
import { SelectionProvider } from './SelectionContext';
import { ComposeProvider } from './ComposeContext';
import { LayersProvider } from './LayersContext';
import { AlignProvider } from './AlignContext';
import { TreeMoveProvider } from './TreeMoveContext';
import { useMaplibre } from './useMaplibre';
import { MapErrorOverlay } from './MapErrorOverlay';

type Props = {
  initialCenter: Cursor;
  initialZoom: number;
  children?: ReactNode;
};

/**
 * Full-bleed map container that owns the MapLibre instance and exposes it
 * (plus the cursor coords) through MapContext to anything rendered above it.
 */
export function MapShell({ initialCenter, initialZoom, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, cursor, error } = useMaplibre({
    ref: containerRef,
    initialCenter,
    initialZoom,
  });

  return (
    <MapContext.Provider value={{ map, cursor }}>
      <SelectionProvider>
        <ComposeProvider>
          <LayersProvider>
            <AlignProvider>
              <TreeMoveProvider>
                <main className="relative h-screen w-screen overflow-hidden bg-paper">
                  <div ref={containerRef} className="h-full w-full" />
                  {error ? <MapErrorOverlay message={error} /> : null}
                  {children}
                </main>
              </TreeMoveProvider>
            </AlignProvider>
          </LayersProvider>
        </ComposeProvider>
      </SelectionProvider>
    </MapContext.Provider>
  );
}
