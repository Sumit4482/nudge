import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { useNow } from '../hooks/useNow';
import { phaseOf, type Phase } from '../planner/phase';
import { useApp } from '../store/useApp';
import { lerpPalette } from './color';
import { DURATION, PALETTES, type Palette } from './palettes';

interface PhaseValue {
  /** The phase the day is in right now. */
  phase: Phase;
  /** Colors in use. They glide to the new phase over 1.8 seconds. */
  palette: Palette;
}

const Ctx = createContext<PhaseValue | null>(null);

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** The sky follows the day: anchors on weekdays, the clock on free days. */
export function PhaseProvider({ children }: { children: ReactNode }) {
  const anchors = useApp((s) => s.anchors);
  const rest = useApp((s) => s.rest);
  const { now, dow } = useNow();
  const reduced = useReducedMotion();
  const phase = phaseOf({ anchors, dow, now, rest: rest !== 'normal' });
  const target = PALETTES[phase];

  const [shown, setShown] = useState<Palette>(target);
  const current = useRef<Palette>(target);

  useEffect(() => {
    if (reduced) return;
    const from = current.current;
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / DURATION.color);
      const next = t >= 1 ? target : lerpPalette(from, target, easeOut(t));
      current.current = next;
      setShown(next);
      if (t >= 1) clearInterval(id);
    }, 70);
    return () => clearInterval(id);
  }, [target, reduced]);

  const palette = reduced ? target : shown;
  const value = useMemo(() => ({ phase, palette }), [phase, palette]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePhase(): PhaseValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePhase must be used inside PhaseProvider');
  return v;
}
