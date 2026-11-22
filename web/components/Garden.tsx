'use client';

import { useEffect, useRef, useState } from 'react';

import { BEES_DISTURB } from '@/lib/bees';
import { gardenStage, STAGES } from '@/lib/garden';

/** How full the jar is at each stage. */
const LEVEL = [0.07, 0.28, 0.5, 0.72, 0.94] as const;
/** Small honeycomb cells floating in the honey, lowest first. */
const CELLS: [number, number][] = [
  [100, 198], [78, 190], [122, 192], [90, 176], [114, 178], [70, 168], [126, 168], [100, 150], [82, 134], [118, 130],
];
const CELLS_AT = [0, 1, 3, 5, 8] as const;

function Bee({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g className={`bee${flip ? ' b2' : ''}`}>
      <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
        <ellipse className="w" cx="-3" cy="-7" rx="6" ry="4" fill="#EAF4FB" opacity=".95" />
        <ellipse className="w" cx="5" cy="-8" rx="6" ry="4" fill="#EAF4FB" opacity=".95" />
        <ellipse cx="1" cy="0" rx="10" ry="7" fill="#FBD76B" />
        <path d="M-2 -6 V6 M3 -6.5 V6.5" stroke="#6B5A3E" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="9" cy="-1" r="1.4" fill="#6B5A3E" />
      </g>
    </g>
  );
}

const JAR = 'M54 70 Q54 56 68 56 H132 Q146 56 146 70 V190 Q146 212 124 212 H76 Q54 212 54 190 Z';

const SEEN_KEY = 'nudge-bee-seen';

/** A glass jar that fills with honey, cell by cell, as the streak grows. Tapping it disturbs every bee on the page. */
export function Garden({ streak }: { streak: number }) {
  const st = gardenStage(streak);
  const top = 210 - LEVEL[st] * (210 - 68);
  // A long wave so the surface can drift sideways forever without a gap.
  const surface = `M-46 ${top} Q-23 ${top - 7} 0 ${top} T46 ${top} T92 ${top} T138 ${top} T184 ${top} T230 ${top}`;
  const [loiter, setLoiter] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // One small bee waits on the lid until the jar has been tapped once. After that it leaves and behaves as usual.
  useEffect(() => {
    try {
      setLoiter(localStorage.getItem(SEEN_KEY) !== '1');
    } catch {
      setLoiter(true);
    }
  }, []);

  const release = () => {
    window.dispatchEvent(new Event(BEES_DISTURB)); // every bee on the page panics, even one that is busy building
    if (loiter && !leaving) {
      setLeaving(true); // it takes off, then goes
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setLoiter(false), 1000);
      try {
        localStorage.setItem(SEEN_KEY, '1');
      } catch {}
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    btn.current?.animate(
      [{ transform: 'rotate(0)' }, { transform: 'rotate(-3deg) scale(1.02)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(-1.5deg)' }, { transform: 'rotate(0)' }],
      { duration: 650, easing: 'ease-in-out' },
    );
  };

  return (
    <div className="jar-wrap">
      <button ref={btn} className="jar-btn" onClick={release} aria-label="Tap the honey jar">
        <svg viewBox="0 0 200 230" role="img" aria-label={`A honey jar, stage ${STAGES[st]}`}>
          <defs>
            <clipPath id="jarClip">
              <path d={JAR} />
            </clipPath>
          </defs>
          <ellipse cx="100" cy="220" rx="62" ry="8" fill="currentColor" opacity=".1" />
          <path d={JAR} fill="#FFF6DC" />
          <g clipPath="url(#jarClip)">
            <g className="jar-wave">
              <path d={`${surface} V220 H-46 Z`} fill="#F7D06A" />
              <path d={surface} fill="none" stroke="#FBE3A0" strokeWidth="4" strokeLinecap="round" />
            </g>
            {CELLS.slice(0, CELLS_AT[st]).map(([x, y], i) => (
              <path key={i} className="jar-cell" style={{ animationDelay: `${i * 0.7}s` }} d={`M${x} ${y - 7} l6 3.5 v7 l-6 3.5 l-6 -3.5 v-7z`} fill="#EDB43C" opacity=".9" />
            ))}
          </g>
          <path d={JAR} fill="none" stroke="#EADBB5" strokeWidth="3.4" />
          <path d="M66 76 C66 110 69 140 73 170" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".85" />
          <rect x="60" y="38" width="80" height="22" rx="9" fill="#F3C9A8" />
          <rect x="60" y="38" width="80" height="8" rx="4" fill="#F9DAC0" />
          {loiter ? (
            <g className={`loiter${leaving ? ' gone' : ''}`}>
              <g transform="translate(110 33)">
                <path d="M-3 6 l-1.5 3 M2 6 l1.5 3" stroke="#6B5A3E" strokeWidth="1.4" strokeLinecap="round" />
                <ellipse className="lw" cx="-2" cy="-5" rx="5" ry="3" transform="rotate(-30 -2 -5)" fill="#EAF4FB" opacity=".95" />
                <ellipse cx="0" cy="0" rx="8.5" ry="6" fill="#FBD76B" />
                <path d="M-3 -5 V5 M2 -5.4 V5.4" stroke="#6B5A3E" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="7.4" cy="-1" r="1.3" fill="#6B5A3E" />
              </g>
            </g>
          ) : null}
          {st >= 3 ? <Bee x={40} y={34} /> : null}
          {st >= 4 ? <Bee x={164} y={46} flip /> : null}
        </svg>
      </button>
    </div>
  );
}
