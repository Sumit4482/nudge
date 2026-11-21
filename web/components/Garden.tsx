const STAGES = ['Seeds', 'Sprouts', 'Growing', 'In bloom', 'Orchard'] as const;
const NEXT = [3, 7, 14, 30, null] as const;
const FLOWERS = ['#F4A6A0', '#F6D58B', '#A9C8F0', '#C9B6E8', '#F2B8D2'];

export const gardenStage = (streak: number) => (streak >= 30 ? 4 : streak >= 14 ? 3 : streak >= 7 ? 2 : streak >= 3 ? 1 : 0);
export const gardenCaption = (streak: number) => {
  const st = gardenStage(streak);
  return `${STAGES[st]}. ${streak}-day streak${NEXT[st] ? `, next stage at ${NEXT[st]} days` : ''}. It grows with every proof and only rests when life gets in the way.`;
};

function Leaf({ x, y, r }: { x: number; y: number; r: number }) {
  return <ellipse cx={x} cy={y} rx="9" ry="4.5" transform={`rotate(${r} ${x} ${y})`} fill="#7DB58F" />;
}

function Plant({ cx, st, col }: { cx: number; st: number; col: string }) {
  const y = 112;
  const stem = (h: number) => <path d={`M${cx} ${y} v-${h}`} stroke="#6FA383" strokeWidth="3" strokeLinecap="round" fill="none" />;
  if (st === 0)
    return (
      <>
        <ellipse cx={cx} cy={y - 2} rx="10" ry="4" fill="#9A7B60" />
        <circle cx={cx} cy={y - 5} r="2.5" fill="#6E533D" />
      </>
    );
  if (st === 1)
    return (
      <>
        {stem(24)}
        <Leaf x={cx - 8} y={y - 24} r={-30} />
        <Leaf x={cx + 8} y={y - 27} r={30} />
      </>
    );
  if (st === 2)
    return (
      <>
        {stem(44)}
        <Leaf x={cx - 9} y={y - 16} r={-25} />
        <Leaf x={cx + 9} y={y - 25} r={25} />
        <Leaf x={cx - 9} y={y - 34} r={-25} />
        <Leaf x={cx + 9} y={y - 43} r={25} />
      </>
    );
  if (st === 3) {
    const fy = y - 62;
    return (
      <>
        {stem(56)}
        <Leaf x={cx - 9} y={y - 18} r={-25} />
        <Leaf x={cx + 9} y={y - 30} r={25} />
        <Leaf x={cx - 9} y={y - 40} r={-25} />
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={cx} cy={fy - 8} rx="5" ry="8" transform={`rotate(${a} ${cx} ${fy})`} fill={col} />
        ))}
        <circle cx={cx} cy={fy} r="4.5" fill="#F7D774" />
      </>
    );
  }
  return (
    <>
      <rect x={cx - 4} y={y - 48} width="8" height="48" rx="3" fill="#9A7B60" />
      <circle cx={cx} cy={y - 62} r="20" fill="#7DB58F" />
      <circle cx={cx - 14} cy={y - 50} r="13" fill="#8CC29F" />
      <circle cx={cx + 14} cy={y - 50} r="13" fill="#6FA383" />
      <circle cx={cx - 6} cy={y - 68} r="3.5" fill={col} />
      <circle cx={cx + 9} cy={y - 58} r="3.5" fill={col} />
    </>
  );
}

export function Garden({ streak, level }: { streak: number; level: number }) {
  const st = gardenStage(streak);
  const pots = Math.min(5, Math.max(1, level));
  return (
    <svg viewBox="0 0 340 150" role="img" aria-label={`Garden with ${pots} plants, stage ${STAGES[st]}`}>
      <rect x="0" y="138" width="340" height="12" rx="6" fill="currentColor" opacity=".08" />
      {Array.from({ length: 5 }, (_, i) => {
        const cx = 34 + i * 68;
        const on = i < pots;
        return (
          <g key={i} opacity={on ? 1 : 0.3}>
            <path d={`M${cx - 15} 120h30l-4 20h-22z`} fill="#C98A6B" />
            <rect x={cx - 18} y="113" width="36" height="9" rx="3" fill="#D9A184" />
            {on ? (
              <g className="plant" style={{ animationDelay: `${i * 140}ms` }}>
                <g className="sway" style={{ animationDelay: `${i * 500}ms` }}>
                  <Plant cx={cx} st={st} col={FLOWERS[i]} />
                </g>
              </g>
            ) : (
              <text x={cx} y="100" textAnchor="middle" fontSize="11" fill="currentColor">{`Lv ${i + 1}`}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
