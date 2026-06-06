'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export type CalibrateTool = 'none' | 'sliders' | 'points' | 'reference';

type AlignContextValue = {
  /** Which calibration tool is open (only one at a time). */
  tool: CalibrateTool;
  setTool: (t: CalibrateTool) => void;
  /** True while a tool is capturing map clicks (drag-align or overlay point-fit). */
  aligning: boolean;
  /** Let the reference-image point-fit suppress pin selection while picking points. */
  setCapturingPoints: (v: boolean) => void;
};

const AlignContext = createContext<AlignContextValue>({
  tool: 'none',
  setTool: () => {},
  aligning: false,
  setCapturingPoints: () => {},
});

/** Coordinates the calibration tools so they don't both grab clicks/space. */
export function AlignProvider({ children }: { children: ReactNode }) {
  const [tool, setTool] = useState<CalibrateTool>('none');
  const [capturingPoints, setCapturingPoints] = useState(false);
  return (
    <AlignContext.Provider
      value={{ tool, setTool, aligning: tool === 'points' || capturingPoints, setCapturingPoints }}
    >
      {children}
    </AlignContext.Provider>
  );
}

export function useAlign() {
  return useContext(AlignContext);
}
