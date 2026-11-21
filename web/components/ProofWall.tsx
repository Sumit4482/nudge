'use client';

import { useEffect, useState } from 'react';
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

const FILTERS: { key: 'all' | Tag; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'study', label: 'Study' },
  { key: 'fit', label: 'Fit' },
  { key: 'life', label: 'Life' },
];

function Picture({ p, i }: { p: WallProof; i: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return p.src ? <img src={p.src} alt={`Proof: ${p.title}`} loading="lazy" /> : <Art tag={p.tag} i={i} />;
}

/** The filterable grid of proofs, with a keyboard-friendly lightbox. */
export function ProofWall({ proofs }: { proofs: WallProof[] }) {
  const [filter, setFilter] = useState<'all' | Tag>('all');
  const [open, setOpen] = useState<number | null>(null);
  const list = proofs.map((p, i) => ({ p, i })).filter(({ p }) => filter === 'all' || p.tag === filter);

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((o) => (o == null ? o : (o + 1) % list.length));
      if (e.key === 'ArrowLeft') setOpen((o) => (o == null ? o : (o - 1 + list.length) % list.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, list.length]);

  const cur = open != null ? list[open] : null;

  return (
    <>
      <div className="feed-h">
        <h2>The proof wall</h2>
        <div className="filters" role="group" aria-label="Filter proofs">
          {FILTERS.map((f) => (
            <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="wall">
        {list.length ? (
          list.map(({ p, i }, k) => (
            <button key={p.id} className="p" style={{ animationDelay: `${k * 60}ms` }} onClick={() => setOpen(k)}>
              <div className="img">
                <Picture p={p} i={i} />
                <span className="chip" style={{ ['--tc' as string]: `var(--t-${p.tag})` }}>{TAG_LABEL[p.tag]}</span>
                <span className="when">{p.when}</span>
              </div>
              <div className="b">
                <h3>{p.title}</h3>
                <p>{p.caption}</p>
                <div className="meta">
                  <span>{p.minutes} min</span>
                  <span>+{p.xp} XP</span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <p className="empty">Nothing here yet.</p>
        )}
      </div>

      <div className={`lb${cur ? ' on' : ''}`} role="dialog" aria-modal="true" aria-label="Proof" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
        {cur ? (
          <div className="lbc">
            <div className="img">
              <Picture p={cur.p} i={cur.i} />
            </div>
            <div className="b">
              <h3>{cur.p.title}</h3>
              <p>{cur.p.caption}</p>
              <div className="meta">
                <span>{TAG_LABEL[cur.p.tag]}</span>
                <span>{cur.p.minutes} min</span>
                <span>+{cur.p.xp} XP</span>
                <span>{cur.p.when}</span>
              </div>
              <div className="lbn">
                <button onClick={() => setOpen((open! - 1 + list.length) % list.length)}>Previous</button>
                <button onClick={() => setOpen((open! + 1) % list.length)}>Next</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
