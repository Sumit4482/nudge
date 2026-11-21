import { daysBetween } from '../lib/dates';
import type { Tag, Task } from '../types';

export const MAX_MUST = 3;

/** Weekend, travel and sick days have no office and plan from the clock. */
export function isFreeDay(dow: number, rest: boolean): boolean {
  return dow === 6 || dow === 0 || rest;
}

/**
 * Is this task due today? Not done, not paused, and its date has come.
 * An everyDays routine is due once that many days have passed since it was last finished (or if it never was).
 * Any other task follows its weekdays.
 */
export function isDue(t: Task, dow: number, date?: string): boolean {
  if (t.done || t.off) return false;
  if (t.dueDate && date && t.dueDate > date) return false;
  if (t.extraDay && date && t.extraDay === date) return true;
  if (t.everyDays) return !t.lastDone || !date || daysBetween(t.lastDone, date) >= t.everyDays;
  return !t.days?.length || t.days.includes(dow);
}

/** Tasks that count toward today: not done, not paused, and due today. */
export function dueToday(tasks: Task[], dow: number, date?: string): Task[] {
  return tasks.filter((t) => isDue(t, dow, date));
}

/** At most 3 must-do tasks per day. */
export function mustCount(tasks: Task[], dow: number): number {
  return dueToday(tasks, dow).filter((t) => t.must).length;
}

export function canAddMust(tasks: Task[], dow: number): boolean {
  return mustCount(tasks, dow) < MAX_MUST;
}

export function guessTag(title: string): Tag {
  if (/gym|workout|run|walk|yoga|exercise|swim|stretch/i.test(title)) return 'fit';
  if (/study|read|exam|chapter|physics|chem|math|revise|notes|assignment|report|project|thesis|learn|code/i.test(title)) return 'study';
  return 'life';
}

/** Canned breakdown used until Claude is wired in (Phase 7). First step takes about 2 minutes. */
export function cannedSteps(tag: Tag): string[] {
  return {
    study: [
      'Open notes and set a 25-min timer',
      'Write the 3 things you must cover',
      'Do the hardest part first, 20 min',
      'Quiz yourself with the page closed',
      'Write a 5-line summary',
    ],
    fit: [
      'Shoes on and water filled (2 min)',
      'Warm up for 5 minutes',
      'Main set, no phone',
      'Stretch and breathe for 5 minutes',
      'Take the proof selfie',
    ],
    life: [
      'Do the 2-minute starter version',
      'Gather everything you need in one place',
      'Work in one 15-minute block',
      'Check it off and clear up',
      'Photo of the result',
    ],
  }[tag];
}
