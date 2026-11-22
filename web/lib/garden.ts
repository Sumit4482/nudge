export const STAGES = ['Seeds', 'Sprouts', 'Growing', 'In bloom', 'Orchard'] as const;
export const NEXT = [3, 7, 14, 30, null] as const;

export const gardenStage = (streak: number) => (streak >= 30 ? 4 : streak >= 14 ? 3 : streak >= 7 ? 2 : streak >= 3 ? 1 : 0);
export const gardenCaption = (streak: number) => {
  const st = gardenStage(streak);
  return `Honey jar · ${streak}-day streak${NEXT[st] ? `, next stage at ${NEXT[st]} days` : ''}`;
};
