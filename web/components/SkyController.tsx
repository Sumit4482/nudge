'use client';

import { useEffect } from 'react';

type Phase = 'dawn' | 'day' | 'dusk' | 'night';
const PHASES: Phase[] = ['dawn', 'day', 'dusk', 'night'];

/** The sky follows the visitor's local time. Add ?sky=night (dawn, day, dusk) to preview a look. */
export function SkyController() {
  useEffect(() => {
    const h = new Date().getHours();
    const auto: Phase = h >= 5 && h < 11 ? 'dawn' : h >= 11 && h < 17 ? 'day' : h >= 17 && h < 21 ? 'dusk' : 'night';
    const q = new URLSearchParams(window.location.search).get('sky') as Phase | null;
    document.documentElement.dataset.phase = q && PHASES.includes(q) ? q : auto;
  }, []);
  return (
    <div className="sky" aria-hidden="true">
      <i className="layer l-dawn" />
      <i className="layer l-day" />
      <i className="layer l-dusk" />
      <i className="layer l-night" />
      <div className="stars" />
      <i className="cloud c1" />
      <i className="cloud c2" />
      <div className="orb" />
    </div>
  );
}
