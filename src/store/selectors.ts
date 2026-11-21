import { MY_TIMES } from '../lib/times';
import { learnedTimes } from '../planner/learned';
import { plan } from '../planner';
import type { DefaultTimes, PlanOutput } from '../types';
import type { useApp } from './useApp';

type State = ReturnType<typeof useApp.getState>;
type PlanInputState = Pick<State, 'tasks' | 'anchors' | 'rest' | 'learned' | 'anchorLog'> & { active?: State['active'] };

/** Your real leave and home times, when learning is on and there is enough history. */
export function planDefaults(learned: boolean, log: State['anchorLog']): Partial<DefaultTimes> | undefined {
  if (!learned) return undefined;
  const l = learnedTimes(log);
  const d: Partial<DefaultTimes> = {};
  if (l.leave != null) d.leave = l.leave;
  if (l.home != null) d.home = l.home;
  return Object.keys(d).length ? d : undefined;
}

/** Build today's plan from the saved state. */
export function buildPlan(s: PlanInputState, now: number, dow: number, date: string): PlanOutput {
  // A run already in progress stays on the plan even if rest mode pauses its routine.
  const tasks =
    s.rest !== 'normal' && s.active
      ? s.tasks.map((t) => (t.id === s.active!.taskId && (t.routine || t.chore) ? { ...t, routine: false, chore: false } : t))
      : s.tasks;
  return plan({
    tasks,
    anchors: s.anchors,
    now,
    dow,
    rest: s.rest !== 'normal',
    date,
    defaults: { ...MY_TIMES, ...planDefaults(s.learned, s.anchorLog) },
  });
}
