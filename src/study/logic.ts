import { addDays } from '../lib/dates';

/** 0 = to do, 1 = learning, 2 = revised */
export type ChapterStatus = 0 | 1 | 2;
export const STATUS_LABEL = ['To do', 'Learning', 'Revised'] as const;

export const nextStatus = (s: ChapterStatus): ChapterStatus => ((s + 1) % 3) as ChapterStatus;

export const REVISION_DAYS = 2;
export const REVIEW_OFFSETS = [1, 3, 7] as const;

/** Spread unfinished chapters across the days left. The last 2 days are revision. */
export function backPlan(chaptersLeft: number, daysLeft: number): { everyDays: number; text: string } {
  if (daysLeft <= 0) return { everyDays: 0, text: 'Exam day. You have done what you could.' };
  if (chaptersLeft <= 0) return { everyDays: 0, text: 'All chapters revised. Revision only.' };
  const usable = Math.max(0, daysLeft - REVISION_DAYS);
  const every = Math.max(1, Math.floor(usable / chaptersLeft));
  const s = chaptersLeft === 1 ? '' : 's';
  return { everyDays: every, text: `${chaptersLeft} chapter${s} left · 1 every ${every} day${every === 1 ? '' : 's'} · last 2 days are revision` };
}

/** Dates for the +1, +3 and +7 day reviews after finishing a chapter. */
export function reviewDates(from: string): string[] {
  return REVIEW_OFFSETS.map((n) => addDays(from, n));
}

/** "Review: Optics 4" from "Physics: Optics 4". */
export function reviewTitle(taskTitle: string): string {
  return `Review: ${taskTitle.replace(/^[^:]+:\s*/, '')}`;
}
