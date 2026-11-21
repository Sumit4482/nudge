import { useMemo } from 'react';
import { useApp } from '../store/useApp';
import { buildPlan } from '../store/selectors';
import type { PlanOutput } from '../types';
import { useNow } from './useNow';

/** Today's plan, rebuilt whenever tasks, anchors, the clock or rest mode change. */
export function usePlan(): PlanOutput & { now: number; dow: number; date: string } {
  const { now, dow, date } = useNow();
  const tasks = useApp((s) => s.tasks);
  const anchors = useApp((s) => s.anchors);
  const rest = useApp((s) => s.rest);
  const learned = useApp((s) => s.learned);
  const anchorLog = useApp((s) => s.anchorLog);
  const active = useApp((s) => s.active);
  const out = useMemo(
    () => buildPlan({ tasks, anchors, rest, learned, anchorLog, active }, now, dow, date),
    [tasks, anchors, rest, learned, anchorLog, active, now, dow, date],
  );
  return { ...out, now, dow, date };
}
