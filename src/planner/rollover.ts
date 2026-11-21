import type { Task } from '../types';
import { dueToday } from './rules';

/** A task skipped this many times must be broken down or dropped. */
export const ROLL_LIMIT = 3;

/**
 * End of day: every open one-off task due today counts as skipped once.
 * Routines and chores never pile up. Rest mode (travel or sick) does not count anything as skipped.
 * Tasks you moved to tomorrow yourself were already counted, so they are only released.
 */
export function rollover(tasks: Task[], dow: number, rest: boolean, date?: string): Task[] {
  const open = new Set(dueToday(tasks, dow, date).map((t) => t.id));
  return tasks.map((t) => {
    if (t.tomorrow) return { ...t, tomorrow: false, pinnedStart: null };
    if (rest || t.routine || t.chore || !open.has(t.id)) return { ...t, pinnedStart: null };
    return { ...t, rolled: t.rolled + 1, pinnedStart: null };
  });
}

export const needsSplitOrDrop = (t: Pick<Task, 'rolled'>) => t.rolled >= ROLL_LIMIT;
