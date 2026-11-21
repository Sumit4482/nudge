import type { Block, PlanInput, PlanOutput, Task, WinId } from '../types';
import { isDue } from './rules';
import { BIG_TASK, DEFAULT_TIMES, MIN_FREE, MIN_WINDOW, READY_BUFFER, SLEEP_BUFFER, TASK_GAP } from './constants';

interface RawWin {
  id: WinId;
  s: number;
  e: number;
  pred: boolean;
}
interface Seg extends RawWin {
  cur: number;
}
interface Interval {
  s: number;
  e: number;
}

/** Remove busy intervals from windows. A window can split in two. */
function cut(ws: RawWin[], ivs: Interval[]): RawWin[] {
  const out: RawWin[] = [];
  for (const w of ws) {
    let segs: RawWin[] = [w];
    for (const b of ivs) {
      segs = segs.flatMap((g) => {
        if (b.e <= g.s || b.s >= g.e) return [g];
        const r: RawWin[] = [];
        if (b.s > g.s) r.push({ ...g, e: b.s });
        if (b.e < g.e) r.push({ ...g, s: b.e });
        return r;
      });
    }
    out.push(...segs);
  }
  return out;
}

/**
 * Build the day from anchors, tasks and the clock. Pure: same input, same output.
 * Minutes are since midnight.
 */
export function plan(input: PlanInput): PlanOutput {
  const { tasks, anchors: a, now, dow, busy = [], rest = false, date } = input;
  const def = { ...DEFAULT_TIMES, ...input.defaults };
  const freeDay = dow === 6 || dow === 0 || rest;
  const n = Math.ceil(now / 5) * 5;
  const wake = a.wake ?? def.wake;
  const sleepEnd = (a.sleep ?? def.sleep) - SLEEP_BUFFER;

  const raw: RawWin[] = (
    freeDay
      ? [
          { id: 'm', s: wake + READY_BUFFER, e: 780 },
          { id: 'a', s: 840, e: 1110 },
          { id: 'e', s: 1170, e: sleepEnd },
        ]
      : [
          { id: 'm', s: wake + READY_BUFFER, e: (a.leave ?? def.leave) - READY_BUFFER },
          { id: 'e', s: (a.home ?? def.home) + READY_BUFFER, e: sleepEnd },
        ]
  ).map((w) => ({ ...(w as Omit<RawWin, 'pred'>), pred: !freeDay && w.id === 'e' && a.home == null }));

  const pool = tasks.filter((t) => isDue(t, dow, date) && (!rest || !(t.routine || t.chore)));
  const manual = pool.filter((t) => t.tomorrow);
  const live = pool.filter((t) => !t.tomorrow);

  const overlapsBusy = (s: number, e: number) => busy.some((b) => s < b.e && e > b.s);
  const pins = live.filter(
    (t) =>
      t.pinnedStart != null &&
      t.pinnedStart >= n &&
      raw.some((w) => t.pinnedStart! >= w.s && t.pinnedStart! + t.mins <= w.e) &&
      !overlapsBusy(t.pinnedStart, t.pinnedStart + t.mins),
  );

  const ivs: Interval[] = [
    ...busy.map((b) => ({ s: b.s - TASK_GAP, e: b.e + TASK_GAP })),
    ...pins.map((t) => ({ s: t.pinnedStart! - TASK_GAP, e: t.pinnedStart! + t.mins + TASK_GAP })),
  ];

  const W: Seg[] = cut(raw, ivs)
    .map((w) => ({ ...w, cur: Math.max(w.s, n) }))
    .filter((w) => w.e - w.cur >= MIN_WINDOW);

  const order = live
    .filter((t) => !pins.includes(t))
    .sort((x, y) => Number(y.must) - Number(x.must) || y.prio - x.prio || y.mins - x.mins);

  const blocks: Block[] = [];
  const later: Task[] = [...manual];
  const win: PlanOutput['win'] = {};
  manual.forEach((t) => {
    win[t.id] = 'later';
  });

  for (const t of pins) {
    const w = raw.find((x) => t.pinnedStart! >= x.s && t.pinnedStart! + t.mins <= x.e)!;
    blocks.push({ kind: 'task', t, s: t.pinnedStart!, e: t.pinnedStart! + t.mins, w: w.id, pred: w.pred, pinned: true });
    win[t.id] = 'p';
  }

  for (const t of order) {
    const fits = W.filter((w) => w.e - w.cur >= t.mins);
    if (!fits.length) {
      later.push(t);
      win[t.id] = 'later';
      continue;
    }
    const want: WinId | '' = t.pref === 'morning' ? 'm' : t.pref === 'evening' ? 'e' : '';
    const w =
      fits.find((x) => x.id === want) ??
      (t.mins >= BIG_TASK ? fits.reduce((p, q) => (q.e - q.cur > p.e - p.cur ? q : p)) : fits[0]);
    blocks.push({ kind: 'task', t, s: w.cur, e: w.cur + t.mins, w: w.id, pred: w.pred });
    win[t.id] = w.id;
    w.cur += t.mins + TASK_GAP;
  }

  const seen: Partial<Record<WinId, number>> = {};
  for (const w of W) {
    if (w.e - w.cur >= MIN_FREE) {
      const i = (seen[w.id] = (seen[w.id] ?? 0) + 1);
      blocks.push({ kind: 'free', s: w.cur, e: w.e, w: w.id, i, pred: w.pred });
    }
  }

  busy.forEach((b, i) => {
    if (b.e > now) blocks.push({ kind: 'busy', s: b.s, e: b.e, title: b.title ?? 'Busy', i });
  });

  if (!freeDay) {
    const s = a.leave ?? def.officeStart;
    const e = a.home ?? def.home;
    blocks.push({ kind: 'office', s, e, done: a.home != null, active: now >= s && a.home == null, pred: a.leave == null });
  }

  const inOffice = blocks.some((b) => b.kind === 'office' && b.active);
  if (!inOffice) blocks.push({ kind: 'now', s: now });

  blocks.sort((x, y) => x.s - y.s || Number(x.kind !== 'now') - Number(y.kind !== 'now'));
  const placed = blocks.filter((b): b is Extract<Block, { kind: 'task' }> => b.kind === 'task');
  return { blocks, later, win, placed };
}
