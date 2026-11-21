import type { Task } from './types';
import { dueToday } from './planner/rules';

export const STAKE_XP = 50;

/** Staked tasks still open at the end of the day. */
export function missedStakes(tasks: Task[], dow: number, date?: string): Task[] {
  return dueToday(tasks, dow, date).filter((t) => t.stake);
}

/** XP after the penalty. Never below zero. */
export const applyPenalty = (xp: number, missed: number) => Math.max(0, xp - STAKE_XP * missed);
