import type { Block } from '../types';

export const MIN_CHECKIN_FREE = 20;

/** The next real free block (20+ minutes, not predicted) that starts after `now`. */
export function nextFreeBlock(blocks: Block[], now: number): { s: number; e: number } | null {
  const free = blocks
    .filter((b): b is Extract<Block, { kind: 'free' }> => b.kind === 'free' && !b.pred && b.e - b.s >= MIN_CHECKIN_FREE && b.s > now)
    .sort((a, b) => a.s - b.s);
  return free.length ? { s: free[0].s, e: free[0].e } : null;
}
