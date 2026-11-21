import type { Anchors } from '../types';

export type Phase = 'dawn' | 'day' | 'dusk' | 'night';

/**
 * Which sky to show. Weekdays follow the anchors; free days (weekend, travel, sick)
 * follow the clock: before 11:00 dawn, before 17:00 day, before 20:30 dusk, else night.
 */
export function phaseOf(input: { anchors: Anchors; dow: number; now: number; rest?: boolean }): Phase {
  const { anchors: a, dow, now, rest = false } = input;
  const freeDay = dow === 6 || dow === 0 || rest;
  if (freeDay) {
    if (a.sleep != null) return 'night';
    const h = now / 60;
    return h < 11 ? 'dawn' : h < 17 ? 'day' : h < 20.5 ? 'dusk' : 'night';
  }
  if (a.sleep != null || a.wake == null) return 'night';
  if (a.home != null) return 'dusk';
  if (a.leave != null) return 'day';
  return 'dawn';
}
