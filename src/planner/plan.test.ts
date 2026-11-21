import { describe, expect, it } from 'vitest';
import type { Task } from '../types';
import { plan } from './plan';
import { dur, fmt } from './time';

let seq = 0;
const T = (p: Partial<Task> = {}): Task => ({
  id: `t${++seq}`,
  title: p.title ?? `Task ${seq}`,
  mins: 30,
  tag: 'life',
  must: false,
  prio: 2,
  pref: 'any',
  rolled: 0,
  ...p,
});

const WED = 3;
const SAT = 6;

describe('time helpers', () => {
  it('formats clock and duration', () => {
    expect(fmt(482)).toBe('08:02');
    expect(fmt(1380)).toBe('23:00');
    expect(dur(45)).toBe('45m');
    expect(dur(60)).toBe('1h');
    expect(dur(90)).toBe('1h 30m');
  });
});

describe('plan: anchors move the windows', () => {
  it('1. woke 07:42: morning is 08:02 to 09:55 and holds the workout', () => {
    const workout = T({ title: 'Workout', mins: 30, pref: 'morning', must: true });
    const r = plan({ tasks: [workout], anchors: { wake: 462 }, now: 470, dow: WED });
    expect(r.placed).toHaveLength(1);
    expect(r.placed[0]).toMatchObject({ s: 482, e: 512, w: 'm', pred: false });
    const free = r.blocks.find((b) => b.kind === 'free' && b.w === 'm');
    expect(free).toMatchObject({ s: 522, e: 595 });
  });

  it('2. home tapped at 17:40 opens the evening at 18:00 and pulls tasks back in', () => {
    const mk = () => [T({ mins: 60, pref: 'evening' }), T({ mins: 60, pref: 'evening' }), T({ mins: 50, pref: 'evening' }), T({ mins: 25, pref: 'evening' })];
    const late = plan({ tasks: mk(), anchors: { wake: 462, leave: 620 }, now: 1000, dow: WED });
    expect(late.later).toHaveLength(1);
    expect(late.later[0].mins).toBe(25);
    expect(late.placed.every((b) => b.pred)).toBe(true);
    expect(late.placed[0].s).toBe(1190);

    const early = plan({ tasks: mk(), anchors: { wake: 462, leave: 620, home: 1060 }, now: 1060, dow: WED });
    expect(early.later).toHaveLength(0);
    expect(early.placed).toHaveLength(4);
    expect(early.placed[0]).toMatchObject({ s: 1080, pred: false });
  });

  it('3. waking at 09:30 leaves a morning under 10 minutes, so the workout goes to the evening', () => {
    const w = T({ pref: 'morning', mins: 30 });
    const r = plan({ tasks: [w], anchors: { wake: 570 }, now: 575, dow: WED });
    expect(r.placed[0].w).toBe('e');
    expect(r.placed[0].pred).toBe(true);
  });

  it('4. leaving for office closes the morning and moves tasks to tonight', () => {
    const w = T({ pref: 'morning', mins: 30 });
    const r = plan({ tasks: [w], anchors: { wake: 462, leave: 620 }, now: 625, dow: WED });
    expect(r.placed[0]).toMatchObject({ w: 'e', pred: true });
    const office = r.blocks.find((b) => b.kind === 'office');
    expect(office).toMatchObject({ s: 620, e: 1170, active: true, done: false });
  });

  it('5. tapping sleep sends everything to tomorrow', () => {
    const tasks = [T(), T({ mins: 60 })];
    const r = plan({ tasks, anchors: { wake: 462, leave: 620, home: 1100, sleep: 1400 }, now: 1405, dow: WED });
    expect(r.placed).toHaveLength(0);
    expect(r.later).toHaveLength(2);
  });

  it('6. Saturday has three windows, no office, and routines appear', () => {
    const laundry = T({ title: 'Laundry', mins: 45, pref: 'morning', days: [SAT], routine: true });
    const review = T({ title: 'Weekly review', mins: 15, days: [0], routine: true });
    const any = T({ title: 'Anything', mins: 30 });
    const r = plan({ tasks: [laundry, review, any], anchors: { wake: 482 }, now: 490, dow: SAT });
    expect(r.blocks.some((b) => b.kind === 'office')).toBe(false);
    expect(r.win[laundry.id]).toBe('m');
    expect(r.win[review.id]).toBeUndefined();
    expect(r.placed.map((b) => b.t.id)).toContain(any.id);
    expect(r.blocks.filter((b) => b.kind === 'free').length).toBeGreaterThanOrEqual(2);
  });

  it('7. overflow: must-dos are placed first, the lowest priority goes to later', () => {
    const m1 = T({ mins: 80, must: true, prio: 3, pref: 'evening' });
    const m2 = T({ mins: 80, must: true, prio: 3, pref: 'evening' });
    const low = T({ mins: 60, must: false, prio: 1, pref: 'evening' });
    const r = plan({ tasks: [low, m1, m2], anchors: { wake: 462, leave: 620 }, now: 700, dow: WED });
    expect(r.placed.map((b) => b.t.id)).toEqual([m1.id, m2.id]);
    expect(r.later.map((t) => t.id)).toEqual([low.id]);
  });

  it('8. a calendar event removes its hour from the evening', () => {
    const t = T({ mins: 30, pref: 'evening' });
    const r = plan({
      tasks: [t],
      anchors: { wake: 462 },
      now: 470,
      dow: WED,
      busy: [{ s: 1200, e: 1260, title: 'Team call' }],
    });
    expect(r.placed[0].s).toBe(1270);
    expect(r.blocks.find((b) => b.kind === 'busy')).toMatchObject({ s: 1200, e: 1260, title: 'Team call' });
  });
});

describe('plan: rules', () => {
  it('rounds the clock up to 5 minutes', () => {
    const t = T({ pref: 'morning', mins: 20 });
    const r = plan({ tasks: [t], anchors: { wake: 420 }, now: 471, dow: WED });
    expect(r.placed[0].s).toBe(475);
  });

  it('leaves a 10 minute gap after each task', () => {
    const a = T({ mins: 30, pref: 'morning', must: true });
    const b = T({ mins: 20, pref: 'morning' });
    const r = plan({ tasks: [a, b], anchors: { wake: 462 }, now: 470, dow: WED });
    expect(r.placed[0].s).toBe(482);
    expect(r.placed[1].s).toBe(482 + 30 + 10);
  });

  it('sends tasks of 40+ minutes to the largest window when they have no preference', () => {
    const big = T({ mins: 45, pref: 'any' });
    const r = plan({ tasks: [big], anchors: { wake: 462 }, now: 470, dow: WED });
    // evening predicted window (190 min) is larger than the morning one (113 min)
    expect(r.placed[0].w).toBe('e');
  });

  it('skips done, paused and wrong-day tasks', () => {
    const done = T({ done: true });
    const off = T({ off: true });
    const wrong = T({ days: [1] });
    const ok = T({ days: [WED] });
    const r = plan({ tasks: [done, off, wrong, ok], anchors: { wake: 462 }, now: 470, dow: WED });
    expect(r.placed.map((b) => b.t.id)).toEqual([ok.id]);
  });

  it('uses learned defaults when given', () => {
    const t = T({ mins: 30, pref: 'evening' });
    const base = plan({ tasks: [t], anchors: { wake: 462, leave: 620 }, now: 700, dow: WED });
    const learned = plan({ tasks: [t], anchors: { wake: 462, leave: 620 }, now: 700, dow: WED, defaults: { home: 1150 } });
    expect(base.placed[0].s).toBe(1190);
    expect(learned.placed[0].s).toBe(1170);
  });

  it('puts tasks moved to tomorrow in later without placing them', () => {
    const t = T({ tomorrow: true });
    const r = plan({ tasks: [t], anchors: { wake: 462 }, now: 470, dow: WED });
    expect(r.placed).toHaveLength(0);
    expect(r.later[0].id).toBe(t.id);
    expect(r.win[t.id]).toBe('later');
  });
});

describe('plan: pinned tasks', () => {
  it('treats a pinned task as a fixed block and plans others around it', () => {
    const pinned = T({ mins: 30, pref: 'evening', pinnedStart: 1250 });
    const other = T({ mins: 20, pref: 'evening' });
    const r = plan({ tasks: [pinned, other], anchors: { wake: 462 }, now: 470, dow: WED });
    const p = r.placed.find((b) => b.t.id === pinned.id)!;
    const o = r.placed.find((b) => b.t.id === other.id)!;
    expect(p).toMatchObject({ s: 1250, e: 1280, pinned: true });
    expect(o.s).toBe(1190);
    expect(o.e + 10).toBeLessThanOrEqual(p.s);
  });

  it('ignores a pin outside any window', () => {
    const t = T({ mins: 30, pref: 'evening', pinnedStart: 700 });
    const r = plan({ tasks: [t], anchors: { wake: 462 }, now: 470, dow: WED });
    expect(r.placed[0].pinned).toBeUndefined();
    expect(r.placed[0].s).toBe(1190);
  });

  it('ignores a pin that overlaps a calendar event', () => {
    const t = T({ mins: 30, pref: 'evening', pinnedStart: 1210 });
    const r = plan({ tasks: [t], anchors: { wake: 462 }, now: 470, dow: WED, busy: [{ s: 1200, e: 1260 }] });
    expect(r.placed[0].pinned).toBeUndefined();
  });
});

describe('plan: rest mode', () => {
  it('plans a weekday like a free day and skips routines and chores', () => {
    const routine = T({ routine: true, days: [WED] });
    const chore = T({ chore: true, days: [WED] });
    const normal = T({ mins: 30 });
    const r = plan({ tasks: [routine, chore, normal], anchors: { wake: 462 }, now: 470, dow: WED, rest: true });
    expect(r.blocks.some((b) => b.kind === 'office')).toBe(false);
    expect(r.placed.map((b) => b.t.id)).toEqual([normal.id]);
    expect(r.win[routine.id]).toBeUndefined();
  });
});

describe('plan: block order', () => {
  it('returns blocks sorted by time with the now marker first at a tie', () => {
    const t = T({ mins: 30, pref: 'morning' });
    const r = plan({ tasks: [t], anchors: { wake: 462 }, now: 482, dow: WED });
    const starts = r.blocks.map((b) => b.s);
    expect([...starts].sort((x, y) => x - y)).toEqual(starts);
    expect(r.blocks[0].kind).toBe('now');
  });

  it('hides the now marker while at the office', () => {
    const r = plan({ tasks: [], anchors: { wake: 462, leave: 620 }, now: 800, dow: WED });
    expect(r.blocks.some((b) => b.kind === 'now')).toBe(false);
  });
});
