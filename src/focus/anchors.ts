import { dateStr } from '../lib/date';
import { toast } from '../lib/toast';
import { showNow } from '../notifications/nudges';
import { MY_TIMES } from '../lib/times';
import { dur, fmt } from '../planner';
import { buildPlan, planDefaults } from '../store/selectors';
import { useApp } from '../store/useApp';
import type { AnchorKey } from '../types';

const WHEN = { wake: "I wake up", leave: 'I leave', home: "I'm home" } as const;

const snapshot = (now: number, dow: number, date: string) => buildPlan(useApp.getState(), now, dow, date).win;

/**
 * Tap an anchor (wake, leave, home, sleep). Re-plans the day, says what changed,
 * and fires any if-then plans you set for this moment.
 */
export function tapAnchorWithFeedback(key: AnchorKey, now: number, dow: number, date = dateStr()): void {
  const before = snapshot(now, dow, date);
  useApp.getState().tapAnchor(key, now);
  const s = useApp.getState();
  const after = snapshot(now, dow, date);
  const moved = Object.keys(after).filter((id) => before[id] !== after[id]).length;
  const at = s.anchors[key] ?? now;
  const homeDefault = planDefaults(s.learned, s.anchorLog)?.home ?? MY_TIMES.home;

  let msg: string;
  if (key === 'leave') msg = `Left at ${fmt(at)}. ${moved ? `${moved} task${moved > 1 ? 's' : ''} moved to tonight.` : 'Tonight stays as planned.'}`;
  else if (key === 'home') {
    const gain = homeDefault - at;
    msg =
      gain > 0
        ? `Home ${dur(gain)} early. Tonight just grew${moved ? `, ${moved} re-planned` : ''}.`
        : gain < 0
          ? `Home ${dur(-gain)} late. Tonight shrinks${moved ? `, ${moved} re-planned` : ''}.`
          : 'Home on time. Plan holds.';
  } else if (key === 'sleep') msg = 'Day closed. Unfinished tasks roll to tomorrow.';
  else msg = `Up at ${fmt(at)}. Morning is re-planned around it.`;
  toast(msg);

  // If-then plans: "when I'm home, start Physics".
  if (key !== 'sleep' && s.rest !== 'sick') {
    for (const t of s.tasks) {
      if (t.trigger?.when !== key || t.done || t.tomorrow) continue;
      showNow({
        title: `You said: when ${WHEN[key]}…`,
        body: `Start "${t.title}" now? ${dur(t.mins)}.`,
        data: { kind: 'trigger', taskId: t.id },
      }).catch(() => undefined);
    }
  }
}
