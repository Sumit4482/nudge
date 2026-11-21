import type { Tag, Task } from './types';

export const XP_PER_LEVEL = 500;
export const REWARD_GOAL_XP = 1500;
/** Chance of a bonus drop after a finished task. */
export const BONUS_CHANCE = 0.4;

/** XP for finishing a task: round(mins x 1.2), plus 20 for a must-do. */
export function xpFor(task: Pick<Task, 'mins' | 'must'>): number {
  return Math.round(task.mins * 1.2) + (task.must ? 20 : 0);
}

export const level = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;
export const xpIntoLevel = (xp: number) => xp % XP_PER_LEVEL;
export const leveledUp = (before: number, after: number) => level(after) > level(before);

/** A 40% chance of 15 to 34 bonus XP. `rand` returns a number from 0 up to (not including) 1. */
export function rollBonus(rand: () => number = Math.random): number {
  if (rand() >= BONUS_CHANCE) return 0;
  return 15 + Math.floor(rand() * 20);
}

const PRAISE: Record<Tag, [string, string]> = {
  fit: ['Body moved. Brain thanks you.', 'That workout is banked.'],
  study: ['That chapter is in your head now.', 'Future-you passes the exam.'],
  life: ['Life: arranged, a bit better.', 'One less thing on your mind.'],
};

export function praiseLine(tag: Tag, rand: () => number = Math.random): string {
  return PRAISE[tag][rand() < 0.5 ? 0 : 1];
}

/** An extra pill on the reward card, for example "Stake kept". */
export interface RewardPill {
  icon: string;
  text: string;
  gold?: boolean;
}

/** What the reward moment shows after a proof is saved. */
export interface RewardSummary {
  title: string;
  tag: Tag;
  /** XP for the task itself. */
  base: number;
  /** Bonus drop, 0 if none. */
  bonus: number;
  oldXp: number;
  newXp: number;
  /** First finished task of the day: the streak grew. */
  streakUp: boolean;
  streak: number;
  levelUp: boolean;
  level: number;
  praise: string;
  /** Stake kept, reviews set, garden grew, posted to the wall. */
  extras: RewardPill[];
}
