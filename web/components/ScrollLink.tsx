'use client';

import type { ReactNode } from 'react';

/** A link that smoothly scrolls to a section on this page. Works the same on phones and laptops. */
export function ScrollLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(e) => {
        const el = document.getElementById(to);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        history.replaceState(null, '', `#${to}`);
      }}
    >
      {children}
    </a>
  );
}
