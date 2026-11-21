import type { Palette } from './palettes';

type RGBA = [number, number, number, number];

/** Parse #RGB, #RRGGBB, #RRGGBBAA or rgb()/rgba(). */
export function parseColor(c: string): RGBA {
  const s = c.trim();
  if (s.startsWith('#')) {
    let h = s.slice(1);
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return [0, 0, 0, 1];
  const p = m[1].split(',').map((x) => parseFloat(x));
  return [p[0], p[1], p[2], p[3] ?? 1];
}

/** Blend two colors. t is 0 to 1. */
export function lerpColor(a: string, b: string, t: number): string {
  const x = parseColor(a);
  const y = parseColor(b);
  const k = Math.max(0, Math.min(1, t));
  const r = Math.round(x[0] + (y[0] - x[0]) * k);
  const g = Math.round(x[1] + (y[1] - x[1]) * k);
  const bl = Math.round(x[2] + (y[2] - x[2]) * k);
  const al = Math.round((x[3] + (y[3] - x[3]) * k) * 1000) / 1000;
  return `rgba(${r},${g},${bl},${al})`;
}

/** Blend every color in two palettes. Sky stops are blended too. */
export function lerpPalette(a: Palette, b: Palette, t: number): Palette {
  return {
    sky: [lerpColor(a.sky[0], b.sky[0], t), lerpColor(a.sky[1], b.sky[1], t), lerpColor(a.sky[2], b.sky[2], t)],
    ink: lerpColor(a.ink, b.ink, t),
    mute: lerpColor(a.mute, b.mute, t),
    hero: lerpColor(a.hero, b.hero, t),
    heroMute: lerpColor(a.heroMute, b.heroMute, t),
    card: lerpColor(a.card, b.card, t),
    line: lerpColor(a.line, b.line, t),
    accent: lerpColor(a.accent, b.accent, t),
    onAccent: lerpColor(a.onAccent, b.onAccent, t),
    statusBar: t < 0.5 ? a.statusBar : b.statusBar,
  };
}
