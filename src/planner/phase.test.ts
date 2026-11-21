import { describe, expect, it } from 'vitest';
import { phaseOf } from './phase';

describe('phaseOf', () => {
  it('weekday follows the anchors', () => {
    expect(phaseOf({ anchors: {}, dow: 3, now: 400 })).toBe('night');
    expect(phaseOf({ anchors: { wake: 462 }, dow: 3, now: 470 })).toBe('dawn');
    expect(phaseOf({ anchors: { wake: 462, leave: 620 }, dow: 3, now: 700 })).toBe('day');
    expect(phaseOf({ anchors: { wake: 462, leave: 620, home: 1060 }, dow: 3, now: 1070 })).toBe('dusk');
    expect(phaseOf({ anchors: { wake: 462, leave: 620, home: 1060, sleep: 1400 }, dow: 3, now: 1410 })).toBe('night');
  });

  it('weekend follows the clock', () => {
    expect(phaseOf({ anchors: { wake: 480 }, dow: 6, now: 600 })).toBe('dawn');
    expect(phaseOf({ anchors: { wake: 480 }, dow: 6, now: 700 })).toBe('day');
    expect(phaseOf({ anchors: { wake: 480 }, dow: 0, now: 1100 })).toBe('dusk');
    expect(phaseOf({ anchors: { wake: 480 }, dow: 0, now: 1300 })).toBe('night');
    expect(phaseOf({ anchors: { wake: 480, sleep: 900 }, dow: 6, now: 950 })).toBe('night');
  });

  it('rest mode uses the clock on a weekday', () => {
    expect(phaseOf({ anchors: { wake: 462 }, dow: 3, now: 700, rest: true })).toBe('day');
  });
});
