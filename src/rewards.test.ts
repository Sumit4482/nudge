import { describe, expect, it } from 'vitest';
import { level, leveledUp, praiseLine, rollBonus, xpFor, xpIntoLevel } from './rewards';

const seq = (...v: number[]) => {
  let i = 0;
  return () => v[i++ % v.length];
};

describe('rewards', () => {
  it('xp is mins x 1.2 plus 20 for must-dos', () => {
    expect(xpFor({ mins: 30, must: false })).toBe(36);
    expect(xpFor({ mins: 50, must: true })).toBe(80);
    expect(xpFor({ mins: 25, must: false })).toBe(30);
  });

  it('levels every 500 xp', () => {
    expect(level(0)).toBe(1);
    expect(level(499)).toBe(1);
    expect(level(500)).toBe(2);
    expect(level(1240)).toBe(3);
    expect(xpIntoLevel(1240)).toBe(240);
  });

  it('detects a level up', () => {
    expect(leveledUp(480, 520)).toBe(true);
    expect(leveledUp(520, 560)).toBe(false);
  });

  it('bonus drop is 40% likely and 15 to 34 xp', () => {
    expect(rollBonus(seq(0.5))).toBe(0);
    expect(rollBonus(seq(0.39, 0))).toBe(15);
    expect(rollBonus(seq(0.1, 0.999))).toBe(34);
    const rolls = Array.from({ length: 2000 }, () => rollBonus());
    expect(rolls.every((r) => r === 0 || (r >= 15 && r <= 34))).toBe(true);
    const hit = rolls.filter((r) => r > 0).length / rolls.length;
    expect(hit).toBeGreaterThan(0.33);
    expect(hit).toBeLessThan(0.47);
  });

  it('picks a praise line per tag', () => {
    expect(praiseLine('fit', () => 0)).toBe('Body moved. Brain thanks you.');
    expect(praiseLine('study', () => 0.9)).toBe('Future-you passes the exam.');
  });
});
