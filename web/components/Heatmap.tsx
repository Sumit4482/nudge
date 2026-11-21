/** 12 weeks of daily proof counts, Monday first, ending today. */
export function Heatmap({ daily }: { daily: { day: string; n: number }[] }) {
  const byDay = new Map(daily.map((d) => [d.day, d.n]));
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const dow = (today.getDay() + 6) % 7; // Monday = 0
  const cols = Array.from({ length: 12 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const back = (11 - w) * 7 + (dow - d);
      if (back < 0) return -1; // later this week
      const key = new Date(todayUtc - back * 86400000).toISOString().slice(0, 10);
      return byDay.get(key) ?? 0;
    }),
  );
  const shade = (n: number) => (n <= 0 ? '' : `color-mix(in srgb, var(--acc) ${[0, 26, 48, 72, 100][Math.min(4, n)]}%, transparent)`);
  return (
    <>
      <div className="days-l">
        <span>12 weeks ago</span>
        <span>This week</span>
      </div>
      <div className="heat" role="img" aria-label="Proofs per day over the last 12 weeks">
        {cols.map((col, w) => (
          <div key={w}>
            {col.map((n, d) => (
              <i key={d} style={{ background: shade(n), animationDelay: `${(w * 7 + d) * 8}ms` }} title={n < 0 ? '' : `${n} proofs`} />
            ))}
          </div>
        ))}
      </div>
      <div className="legend">
        Less
        {[0, 26, 48, 72, 100].map((p) => (
          <i key={p} style={{ background: p ? `color-mix(in srgb, var(--acc) ${p}%, transparent)` : 'var(--line)' }} />
        ))}
        More
      </div>
    </>
  );
}
