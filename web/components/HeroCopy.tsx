'use client';

import { useEffect, useRef, useState } from 'react';
import { TITLE_FONTS } from '@/lib/fonts';
import { TITLES } from '@/lib/titles';

/**
 * The headline and subtitle. A random pair, in a random title font, fades in on each visit.
 * ?t=5 shows pair number 5 and ?f=sora forces a font, for previews.
 */
export function HeroCopy() {
  const [i, setI] = useState(0);
  const [font, setFont] = useState<(typeof TITLE_FONTS)[number]>('outfit');
  const [picked, setPicked] = useState(false);
  const [ready, setReady] = useState(false);
  const h1 = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const m = location.search.match(/[?&]t=(\d+)/);
    const forced = m ? Number(m[1]) - 1 : -1;
    setI(forced >= 0 && forced < TITLES.length ? forced : Math.floor(Math.random() * TITLES.length));
    const f = location.search.match(/[?&]f=(\w+)/)?.[1] as (typeof TITLE_FONTS)[number] | undefined;
    setFont(f && TITLE_FONTS.includes(f) ? f : TITLE_FONTS[Math.floor(Math.random() * TITLE_FONTS.length)]);
    setPicked(true);
  }, []);

  // Wait (briefly) for the chosen font so the title fades in already in its final look.
  useEffect(() => {
    if (!picked) return;
    const family = h1.current ? getComputedStyle(h1.current).fontFamily : '';
    const wait = family && document.fonts ? Promise.race([document.fonts.load(`48px ${family}`), new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
    let live = true;
    wait.catch(() => undefined).then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, [picked, font]);

  const [h, s] = TITLES[i];
  return (
    <>
      <h1 ref={h1} className="hc" data-font={font} data-ready={ready ? '' : undefined}>
        {h}
      </h1>
      <p className="lede hc" data-ready={ready ? '' : undefined}>
        {s}
      </p>
    </>
  );
}
