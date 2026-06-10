'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { PIN_COLOR_OPTIONS, type PinColorBy } from './pinColor';

type PinColorContextValue = {
  colorBy: PinColorBy;
  setColorBy: (v: PinColorBy) => void;
};

const PinColorContext = createContext<PinColorContextValue>({
  colorBy: 'health',
  setColorBy: () => {},
});

// One choice per device, remembered across reloads (like the basemap pick).
// Read synchronously so the map (a client-only canvas) paints with the saved
// choice on the first frame. Server-rendered consumers of this value (PinLegend)
// gate on useHydrated() to avoid a hydration mismatch.
const STORAGE_KEY = 'treemap.pinColorBy';

function loadPersisted(): PinColorBy {
  if (typeof window === 'undefined') return 'health';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return PIN_COLOR_OPTIONS.includes(v as PinColorBy) ? (v as PinColorBy) : 'health';
}

/** Holds which attribute colours the pins; consumed by the map and the control. */
export function PinColorProvider({ children }: { children: ReactNode }) {
  const [colorBy, setColorBy] = useState<PinColorBy>(loadPersisted);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, colorBy);
    } catch {
      /* private mode / quota — ignore, falls back to default next load */
    }
  }, [colorBy]);

  return (
    <PinColorContext.Provider value={{ colorBy, setColorBy }}>{children}</PinColorContext.Provider>
  );
}

export function usePinColor() {
  return useContext(PinColorContext);
}
