'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Art } from './Art';
import type { Tag } from '@/lib/data';
import { TAG_LABEL } from '@/lib/format';

export interface WallProof {
  id: string;
  title: string;
  tag: Tag;
  caption: string;
  minutes: number;
  xp: number;
  when: string;
  /** Photo address. Empty for sample proofs, which show artwork. */
  src: string;
}

type Filter = 'all' | Tag;
const FILTERS: { v: Filter; label: string }[] = [
  { v: 'all', label: 'All' },
  { v: 'study', label: 'Study' },
  { v: 'fit', label: 'Fit' },
  { v: 'life', label: 'Life' },
];

function Picture({ p, i }: { p: WallProof; i: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return p.src ? <img src={p.src} alt={`Proof: ${p.title}`} loading="lazy" /> : <Art tag={p.tag} i={i} />;
}

/** The proofs, newest first, with a soft filter control. Tap one to see the whole photo. */
export function ProofWall({ proofs }: { proofs: WallProof[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const swipe = useRef(0);
  const visible = useMemo(() => (filter === 'all' ? proofs : proofs.filter((p) => p.tag === filter)), [proofs, filter]);
  const idx = openId ? visible.findIndex((p) => p.id === openId) : -1;
  const cur = idx >= 0 ? visible[idx] : null;
  const step = (n: number) => setOpenId(visible[(idx + n + visible.length) % visible.length].id);

  useEffect(() => {
    if (!cur) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.id, visible]);

  const at = FILTERS.findIndex((f) => f.v === filter);

  return (
    <>
      <div className="seg" role="tablist" aria-label="Filter proofs" style={{ ['--at' as string]: at }}>
        <i className="seg-thumb" aria-hidden="true" />
        {FILTERS.map((f) => (
          <button key={f.v} role="tab" aria-selected={filter === f.v} className={filter === f.v ? 'on' : ''} onClick={() => setFilter(f.v)}>
            {f.label}
          </button>
        ))}
      </div>

      {visible.length ? (
        <div className="rows" key={filter}>
          {visible.map((p, i) => (
            <button key={p.id} className={`row ${p.tag}`} style={{ ['--d' as string]: `${(i % 10) * 60}ms`, ['--w' as string]: `${Math.max(6, Math.min(100, (p.minutes / 90) * 100))}%` }} onClick={() => setOpenId(p.id)} aria-label={`Open photo: ${p.title}`}>
              <span className="th">
                <Picture p={p} i={i} />
              </span>
              <span className="rt">
                <b>
                  {p.title}
                  {p.when === 'just now' ? <i className="newdot" aria-label="just now" /> : null}
                </b>
                <span className="meta">
                  <i className={`dot ${p.tag}`} />
                  {TAG_LABEL[p.tag]} · {p.minutes} min · {p.when}
                </span>
                <span className="bar" aria-hidden="true">
                  <u />
                </span>
              </span>
              <span className="xpb">{p.xp} XP</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="empty">{proofs.length ? 'No proofs here yet.' : 'Nothing here yet. The first photo will land here the moment it is shared.'}</p>
      )}

      <div className={`lb${cur ? ' on' : ''}`} role="dialog" aria-modal="true" aria-label="Proof" onClick={(e) => e.target === e.currentTarget && setOpenId(null)}>
        {cur ? (
          <div
            className="lbc"
            onTouchStart={(e) => {
              swipe.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - swipe.current;
              if (visible.length > 1 && Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
            }}
          >
            <button className="lbx" onClick={() => setOpenId(null)} aria-label="Close photo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <div className="img">
              <Picture p={cur} i={idx} />
            </div>
            <div className="b">
              <h3>{cur.title}</h3>
              <p className="meta">
                <i className={`dot ${cur.tag}`} />
                {TAG_LABEL[cur.tag]} · {cur.minutes} min · {cur.xp} XP · {cur.when}
              </p>
              <div className="lbn">
                {visible.length > 1 ? <button onClick={() => step(-1)}>Previous</button> : null}
                <button onClick={() => setOpenId(null)}>Close</button>
                {visible.length > 1 ? <button onClick={() => step(1)}>Next</button> : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
