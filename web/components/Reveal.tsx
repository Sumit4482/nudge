'use client';

import { useEffect } from 'react';

/** Fades things in as they scroll into view. Anything with data-reveal gets data-in once it is visible. */
export function Reveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.setAttribute('data-in', '1'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.setAttribute('data-in', '1');
            io.unobserve(en.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return null;
}
