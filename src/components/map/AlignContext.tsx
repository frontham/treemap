'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { OverlayView } from '@/server/trpc/routers/overlays';

export type CalibrateTool = 'none' | 'sliders' | 'points' | 'reference';

type AlignContextValue = {
  /** Which calibration tool is open (only one at a time). */
  tool: CalibrateTool;
  setTool: (t: CalibrateTool) => void;
  /** True while a tool is capturing map clicks (drag-align or overlay point-fit). */
  aligning: boolean;
  /** Let the reference-image point-fit suppress pin selection while picking points. */
  setCapturingPoints: (v: boolean) => void;
  /** Saved overlay currently loaded into the reference-image tool for editing, if any. */
  editingOverlay: OverlayView | null;
  /** Open the reference-image tool seeded with an existing saved overlay. */
  editOverlay: (o: OverlayView) => void;
};

const AlignContext = createContext<AlignContextValue>({
  tool: 'none',
  setTool: () => {},
  aligning: false,
  setCapturingPoints: () => {},
  editingOverlay: null,
  editOverlay: () => {},
});

/** Coordinates the calibration tools so they don't both grab clicks/space. */
export function AlignProvider({ children }: { children: ReactNode }) {
  const [tool, setToolState] = useState<CalibrateTool>('none');
  const [capturingPoints, setCapturingPoints] = useState(false);
  const [editingOverlay, setEditingOverlay] = useState<OverlayView | null>(null);

  const setTool = useCallback((t: CalibrateTool) => {
    setToolState(t);
    // Leaving the reference tool ends any in-progress overlay edit.
    if (t !== 'reference') setEditingOverlay(null);
  }, []);

  const editOverlay = useCallback((o: OverlayView) => {
    setEditingOverlay(o);
    setToolState('reference');
  }, []);

  return (
    <AlignContext.Provider
      value={{
        tool,
        setTool,
        aligning: tool === 'points' || capturingPoints,
        setCapturingPoints,
        editingOverlay,
        editOverlay,
      }}
    >
      {children}
    </AlignContext.Provider>
  );
}

export function useAlign() {
  return useContext(AlignContext);
}
