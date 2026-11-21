import { describe, expect, it } from 'vitest';
import { lerpColor, lerpPalette, parseColor } from './color';
import { PALETTES } from './palettes';

describe('color helpers', () => {
  it('parses hex and rgba', () => {
    expect(parseColor('#FF0000')).toEqual([255, 0, 0, 1]);
    expect(parseColor('#f00')).toEqual([255, 0, 0, 1]);
    expect(parseColor('rgba(255,255,255,0.66)')).toEqual([255, 255, 255, 0.66]);
  });

  it('blends two colors', () => {
    expect(lerpColor('#000000', '#FFFFFF', 0.5)).toBe('rgba(128,128,128,1)');
    expect(lerpColor('#000000', '#FFFFFF', 0)).toBe('rgba(0,0,0,1)');
    expect(lerpColor('rgba(0,0,0,0)', 'rgba(0,0,0,1)', 0.5)).toBe('rgba(0,0,0,0.5)');
  });

  it('clamps t', () => {
    expect(lerpColor('#000000', '#FFFFFF', 3)).toBe('rgba(255,255,255,1)');
  });

  it('blends palettes and keeps the status bar of the nearer one', () => {
    const mid = lerpPalette(PALETTES.dawn, PALETTES.night, 0.9);
    expect(mid.statusBar).toBe('light');
    expect(lerpPalette(PALETTES.dawn, PALETTES.night, 0.1).statusBar).toBe('dark');
    expect(lerpPalette(PALETTES.dawn, PALETTES.night, 0).ink).toBe(lerpColor(PALETTES.dawn.ink, PALETTES.dawn.ink, 0));
  });
});
