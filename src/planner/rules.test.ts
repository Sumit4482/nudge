import { describe, expect, it } from 'vitest';
import type { Task } from '../types';
import { canAddMust, cannedSteps, dueToday, guessTag, isDue, mustCount } from './rules';

const T = (p: Partial<Task>): Task => ({ id: 'x', title: 't', mins: 30, tag: 'life', must: false, prio: 2, pref: 'any', rolled: 0, ...p });

describe('rules', () => {
  it('counts only due, open must-do tasks', () => {
    const tasks = [T({ must: true }), T({ must: true, done: true }), T({ must: true, days: [1] }), T({ must: false })];
    expect(mustCount(tasks, 3)).toBe(1);
    expect(dueToday(tasks, 3)).toHaveLength(2);
  });

  it('an every-N-days routine is due when never done, and again N days after it was last done', () => {
    const t = T({ everyDays: 2, routine: true });
    expect(isDue(t, 3, '2026-11-20')).toBe(true);
    const done = { ...t, lastDone: '2026-11-20' };
    expect(isDue(done, 3, '2026-11-21')).toBe(false);
    expect(isDue(done, 3, '2026-11-22')).toBe(true);
    expect(isDue(done, 3, '2026-11-30')).toBe(true); // overdue stays due, it does not pile up
    expect(isDue({ ...done, off: true }, 3, '2026-11-30')).toBe(false);
  });

  it('allows at most 3 must-dos', () => {
    const three = [T({ must: true }), T({ must: true }), T({ must: true })];
    expect(canAddMust(three.slice(0, 2), 3)).toBe(true);
    expect(canAddMust(three, 3)).toBe(false);
  });

  it('guesses a tag from the title', () => {
    expect(guessTag('Morning workout')).toBe('fit');
    expect(guessTag('Finish chemistry assignment')).toBe('study');
    expect(guessTag('Call the bank')).toBe('life');
  });

  it('gives 5 steps with a short first step', () => {
    for (const tag of ['fit', 'study', 'life'] as const) expect(cannedSteps(tag)).toHaveLength(5);
  });
});
