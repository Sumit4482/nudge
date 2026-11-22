'use client';

import { useEffect, useRef } from 'react';
import { BEE_TASK, type BeeRequest, type BeeTask } from '@/lib/bees';

const R = 10.6;
const W = Math.sqrt(3) * R;
const VS = 1.5 * R;

function hexPoints(cx: number, cy: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + (R - 1.2) * Math.cos(a)).toFixed(1)},${(cy + (R - 1.2) * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

/** Tap a cell and it, and the cells around it, wobble outward like a ripple. */
function wobble(e: React.MouseEvent<SVGPolygonElement>) {
  const svg = e.currentTarget.ownerSVGElement;
  if (!svg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cx = Number(e.currentTarget.dataset.cx);
  const cy = Number(e.currentTarget.dataset.cy);
  svg.querySelectorAll<SVGPolygonElement>('polygon').forEach((p) => {
    const d = Math.hypot(Number(p.dataset.cx) - cx, Number(p.dataset.cy) - cy);
    if (d > 48) return;
    p.animate(
      [{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.45) rotate(10deg)' }, { transform: 'scale(.9) rotate(-5deg)' }, { transform: 'scale(1) rotate(0)' }],
      { duration: 750, delay: d * 8, easing: 'cubic-bezier(.22,.8,.3,1)' },
    );
  });
}

/**
 * The last 12 weeks as a honeycomb: one cell per day, Monday at the top, ending today.
 * A day with no proofs is pale cream, and more proofs mean deeper honey.
 */
export function Heatmap({ daily }: { daily: { day: string; n: number }[] }) {
  const svg = useRef<SVGSVGElement>(null);

  // Now and then one bee flies over, lands on a day you finished something, and builds that cell.
  // Days with no proofs are never visited, so the comb only ever grows where there was consistency.
  useEffect(() => {
    const el = svg.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const done = Array.from(el.querySelectorAll<SVGPolygonElement>('polygon[data-done]'));
    if (!done.length) return;
    let seen = false;
    let visible = false;
    let alive = true;
    let last: SVGPolygonElement | null = null;
    let timer: number | undefined;
    const later = (min: number, max: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(visit, min + Math.random() * (max - min));
    };
    const settle = (cell: SVGPolygonElement) => {
      cell.removeAttribute('data-unbuilt');
      window.setTimeout(() => (cell.style.transition = ''), 2200);
    };

    function visit() {
      if (!alive) return;
      if (!visible || document.hidden) return later(1800, 3000);
      const pool = done.length > 1 ? done.filter((c) => c !== last) : done;
      const cell = pool[Math.floor(Math.random() * pool.length)];
      const task: BeeTask = {
        target: () => {
          const r = cell.getBoundingClientRect();
          return { x: r.left + window.scrollX + r.width / 2, y: r.top + window.scrollY + r.height / 2 - 7 };
        },
        work: 2600,
        onArrive: () => {
          // the cell empties, then fills with honey while the bee works
          cell.style.transition = 'none';
          cell.setAttribute('data-unbuilt', '1');
          void cell.getBoundingClientRect();
          window.setTimeout(() => {
            if (!cell.hasAttribute('data-unbuilt')) return;
            cell.style.transition = 'fill 2s cubic-bezier(.22,.8,.3,1)';
            cell.removeAttribute('data-unbuilt');
          }, 350);
        },
        onDone: () => {
          settle(cell);
          cell.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(.95)' }, { transform: 'scale(1)' }], { duration: 700, easing: 'cubic-bezier(.22,.8,.3,1)' });
          last = cell;
          later(3500, 8000);
        },
        onAbort: () => {
          settle(cell);
          later(6000, 11000);
        },
      };
      const req: BeeRequest = { task, accepted: false };
      window.dispatchEvent(new CustomEvent(BEE_TASK, { detail: req }));
      if (!req.accepted) later(2500, 4000);
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible && !seen) {
          seen = true;
          later(1400, 2200);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, [daily]);

  const byDay = new Map(daily.map((d) => [d.day, d.n]));
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = (now.getDay() + 6) % 7; // Monday = 0
  const cells: { w: number; d: number; n: number; key: string; cx: number; cy: number; today: boolean }[] = [];
  for (let w = 0; w < 12; w++) {
    for (let d = 0; d < 7; d++) {
      const back = (11 - w) * 7 + (dow - d);
      if (back < 0) continue; // later this week
      const key = new Date(todayUtc - back * 86400000).toISOString().slice(0, 10);
      cells.push({ w, d, n: byDay.get(key) ?? 0, key, cx: 9 + w * W + (d % 2 ? W / 2 : 0) + W / 2, cy: 12 + d * VS, today: back === 0 });
    }
  }
  const lvl = (n: number) => (n <= 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : 3);
  return (
    <>
      <div className="days-l">
        <span>12 weeks ago</span>
        <span>This week</span>
      </div>
      <svg ref={svg} className="comb" viewBox="0 0 250 134" role="img" aria-label="Proofs per day over the last 12 weeks, as a honeycomb">
        {cells.map((c) => (
          <polygon
            key={c.key}
            className={`hx h${lvl(c.n)}${c.today ? ' today' : ''}`}
            points={hexPoints(c.cx, c.cy)}
            data-done={c.n > 0 ? '1' : undefined}
            data-cx={c.cx}
            data-cy={c.cy}
            onClick={wobble}
            style={{ animationDelay: `${(c.w * 7 + c.d) * 10}ms` }}
          >
            <title>{`${c.n} ${c.n === 1 ? 'proof' : 'proofs'} · ${c.key}`}</title>
          </polygon>
        ))}
      </svg>
      <div className="legend">
        Less
        {[0, 1, 2, 3].map((l) => (
          <i key={l} className={`hexsw h${l}`} />
        ))}
        More
      </div>
    </>
  );
}
