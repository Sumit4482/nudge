/** Garden stage from the streak: 0 seeds, 1 sprouts, 2 growing, 3 in bloom, 4 orchard. */
export function gardenStage(streak: number): 0 | 1 | 2 | 3 | 4 {
  if (streak >= 30) return 4;
  if (streak >= 14) return 3;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1;
  return 0;
}

export const STAGE_NAMES = ['Seeds', 'Sprouts', 'Growing', 'In bloom', 'Orchard'] as const;
/** Streak needed for the next stage, or null when fully grown. */
export const NEXT_STAGE_AT = [3, 7, 14, 30, null] as const;
export const MAX_POTS = 5;

/** Level decides how many plants are unlocked, up to 5. */
export const unlockedPots = (level: number) => Math.min(MAX_POTS, Math.max(1, level));

export const FLOWER_COLORS = ['#F4A6A0', '#F6D58B', '#A9C8F0', '#C9B6E8', '#F2B8D2'] as const;
