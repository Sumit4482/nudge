import { describe, expect, it } from 'vitest';
import { gardenStage, unlockedPots } from './garden';
import { choreFor, nextDue, reminderDates, upcomingDue, type Bill } from './life/logic';
import { learnedTimes, type AnchorDay } from './planner/learned';
import { nextFreeBlock } from './planner/checkin';
import { needsSplitOrDrop, rollover } from './planner/rollover';
import { applyPenalty, missedStakes } from './stakes';
import { backPlan, nextStatus, reviewDates, reviewTitle } from './study/logic';
import type { Block, Task } from './types';

const T = (p: Partial<Task>): Task => ({ id: 'x', title: 't', mins: 30, tag: 'life', must: false, prio: 2, pref: 'any', rolled: 0, ...p });

describe('learned times', () => {
  const day = (i: number, leave: number, home: number): AnchorDay => ({ date: `2026-11-${String(i).padStart(2, '0')}`, leave, home });
  it('needs 10 weekdays', () => {
    const log = Array.from({ length: 9 }, (_, i) => day(i + 1, 610, 1150));
    expect(learnedTimes(log)).toEqual({ samples: 9 });
  });
  it('takes the median of the last 14 and rounds to 5 minutes', () => {
    const log = Array.from({ length: 12 }, (_, i) => day(i + 1, 603 + (i % 3), 1151 + (i % 4)));
    const r = learnedTimes(log);
    expect(r.samples).toBe(12);
    expect(r.leave).toBe(605);
    expect(r.home).toBe(1155);
  });
  it('ignores free days and incomplete days', () => {
    const log: AnchorDay[] = [
      ...Array.from({ length: 10 }, (_, i) => day(i + 1, 600, 1140)),
      { date: '2026-11-20', free: true, leave: 1, home: 2 },
      { date: '2026-11-21', leave: 700 },
    ];
    expect(learnedTimes(log).home).toBe(1140);
  });
});

describe('study', () => {
  it('back-plans chapters across the days left, keeping 2 days for revision', () => {
    expect(backPlan(3, 31).everyDays).toBe(9);
    expect(backPlan(3, 31).text).toBe('3 chapters left · 1 every 9 days · last 2 days are revision');
    expect(backPlan(1, 10).text).toContain('1 chapter left');
    expect(backPlan(0, 10).text).toBe('All chapters revised. Revision only.');
    expect(backPlan(2, 0).text).toContain('Exam day');
    expect(backPlan(5, 3).everyDays).toBe(1);
  });
  it('cycles chapter status', () => {
    expect(nextStatus(0)).toBe(1);
    expect(nextStatus(2)).toBe(0);
  });
  it('makes review dates at +1, +3, +7 days', () => {
    expect(reviewDates('2026-11-19')).toEqual(['2026-11-20', '2026-11-22', '2026-11-26']);
    expect(reviewTitle('Physics: Optics chapter 4')).toBe('Review: Optics chapter 4');
  });
});

describe('bills and chores', () => {
  it('finds the next monthly due date', () => {
    expect(nextDue({ dueDay: 24, repeat: 'monthly' }, '2026-11-19')).toBe('2026-11-24');
    expect(nextDue({ dueDay: 24, repeat: 'monthly' }, '2026-11-24')).toBe('2026-11-24');
    expect(nextDue({ dueDay: 24, repeat: 'monthly' }, '2026-11-25')).toBe('2026-12-24');
    expect(nextDue({ dueDay: 5, repeat: 'monthly' }, '2026-12-20')).toBe('2027-01-05');
  });
  it('uses the last day of a short month', () => {
    expect(nextDue({ dueDay: 31, repeat: 'monthly' }, '2027-02-10')).toBe('2027-02-28');
  });
  it('handles yearly bills', () => {
    expect(nextDue({ dueDay: 15, repeat: 'yearly', month: 12 }, '2026-11-19')).toBe('2026-12-15');
    expect(nextDue({ dueDay: 15, repeat: 'yearly', month: 3 }, '2026-11-19')).toBe('2027-03-15');
  });
  it('moves a paid bill to the next cycle', () => {
    const b: Bill = { id: '1', title: 'Rent', dueDay: 1, repeat: 'monthly', paidFor: '2026-12-01' };
    expect(upcomingDue(b, '2026-11-19')).toBe('2027-01-01');
    expect(upcomingDue({ ...b, paidFor: undefined }, '2026-11-19')).toBe('2026-12-01');
  });
  it('reminds 3 days before and on the day', () => {
    expect(reminderDates('2026-12-01')).toEqual(['2026-11-28', '2026-12-01']);
  });
  it('rotates chores on weekdays only', () => {
    expect(choreFor(1, 0)).toBe('Kitchen reset');
    expect(choreFor(3, 0)).toBe('Dust and mop');
    expect(choreFor(3, 1)).toBe('Fridge clean-out');
    expect(choreFor(6, 0)).toBeNull();
    expect(choreFor(0, 2)).toBeNull();
    expect(choreFor(1, -1)).toBe('Desk and cables reset');
  });
});

describe('garden', () => {
  it('grows at 3, 7, 14 and 30 days', () => {
    expect([0, 2, 3, 6, 7, 13, 14, 29, 30, 100].map(gardenStage)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
  it('unlocks one plant per level up to five', () => {
    expect([1, 3, 5, 9].map(unlockedPots)).toEqual([1, 3, 5, 5]);
  });
});

describe('stakes', () => {
  it('finds open staked tasks due today', () => {
    const tasks = [T({ id: 'a', stake: true }), T({ id: 'b', stake: true, done: true }), T({ id: 'c', stake: true, days: [1] }), T({ id: 'd' })];
    expect(missedStakes(tasks, 3).map((t) => t.id)).toEqual(['a']);
  });
  it('takes 50 XP each and never goes below zero', () => {
    expect(applyPenalty(1240, 2)).toBe(1140);
    expect(applyPenalty(30, 1)).toBe(0);
  });
});

describe('rollover', () => {
  it('counts open one-off tasks as skipped once', () => {
    const tasks = [T({ id: 'a' }), T({ id: 'b', done: true }), T({ id: 'r', routine: true, days: [3] }), T({ id: 'c', chore: true })];
    const out = rollover(tasks, 3, false);
    expect(out.map((t) => t.rolled)).toEqual([1, 0, 0, 0]);
  });
  it('counts nothing in rest mode', () => {
    expect(rollover([T({ id: 'a' })], 3, true)[0].rolled).toBe(0);
  });
  it('releases tasks moved to tomorrow without counting them again', () => {
    const out = rollover([T({ id: 'a', tomorrow: true, rolled: 1, pinnedStart: 900 })], 3, false);
    expect(out[0]).toMatchObject({ rolled: 1, tomorrow: false, pinnedStart: null });
  });
  it('flags tasks skipped 3 times', () => {
    expect(needsSplitOrDrop({ rolled: 2 })).toBe(false);
    expect(needsSplitOrDrop({ rolled: 3 })).toBe(true);
  });
});

describe('check-in', () => {
  const free = (s: number, e: number, pred = false): Block => ({ kind: 'free', s, e, w: 'e', i: 1, pred });
  it('finds the next real free block of 20+ minutes', () => {
    const blocks = [free(500, 510), free(600, 700, true), free(800, 900), free(1000, 1100)];
    expect(nextFreeBlock(blocks, 700)).toEqual({ s: 800, e: 900 });
    expect(nextFreeBlock(blocks, 950)).toEqual({ s: 1000, e: 1100 });
    expect(nextFreeBlock(blocks, 1100)).toBeNull();
  });
});
