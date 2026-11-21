import { dur } from '../planner/time';
import type { Phase } from '../planner/phase';

export type RestMode = 'normal' | 'travel' | 'sick';

/** Greeting and one-line summary for the Today header. */
export function greeting(input: {
  phase: Phase;
  freeDay: boolean;
  rest: RestMode;
  count: number;
  mins: number;
  left: number;
}): [string, string] {
  const { phase, freeDay, rest, count, mins, left } = input;
  const s = (n: number) => (n === 1 ? '' : 's');
  if (rest !== 'normal' && phase !== 'night') return ['Easy day. Be gentle.', `Routines paused. ${count} task${s(count)} planned.`];
  switch (phase) {
    case 'dawn':
      return [freeDay ? 'Weekend. Clear the chores early.' : 'Good morning. Start small.', `${count} task${s(count)} planned, about ${dur(mins)} of work.`];
    case 'day':
      return ['Office mode. Tonight is already planned.', `${count} task${s(count)} waiting for after you get home.`];
    case 'dusk':
      return ["Welcome home. Let's close the day.", `${count} task${s(count)}, about ${dur(mins)}. You have room.`];
    default:
      return left
        ? ['Wind down. Finish what you can.', `${left} task${s(left)} still open today. Anything left tonight goes first tomorrow.`]
        : ['Wind down. Tomorrow is queued.', 'Nothing left for today. Rest well.'];
  }
}
