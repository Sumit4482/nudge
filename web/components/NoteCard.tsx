'use client';

import { useEffect, useRef } from 'react';

/** A small pinned card that says, in a few easy sentences, what this site is. The words appear as if being written. */
export function NoteCard({ name }: { name: string }) {
  const card = useRef<HTMLElement>(null);
  const words = `Hi, I'm ${name}. I plan my day in an app called Nudge. A task only counts once I send a photo, and it lands here. It's how I'm learning to show up every day.`.split(' ');

  useEffect(() => {
    const el = card.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.setAttribute('data-in', '1');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.setAttribute('data-in', '1');
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <aside className="note" ref={card} style={{ ['--n' as string]: words.length }} aria-label={`A note from ${name}`}>
      <span className="pin" aria-hidden="true" />
      <p className="note-k">A note from {name}</p>
      <p className="note-t">
        {words.map((w, i) => (
          <span key={i} className="nw" style={{ ['--i' as string]: i }}>
            {w}{' '}
          </span>
        ))}
      </p>
      <span className="note-sig">{name}</span>
    </aside>
  );
}
