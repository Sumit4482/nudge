import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, daysInMonth, dowOf, shortDate } from './dates';

describe('dates', () => {
  it('adds days across month and year ends', () => {
    expect(addDays('2026-11-29', 3)).toBe('2026-12-02');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts days between dates', () => {
    expect(daysBetween('2026-11-19', '2026-12-20')).toBe(31);
    expect(daysBetween('2026-12-20', '2026-11-19')).toBe(-31);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });

  it('finds the weekday', () => {
    expect(dowOf('2026-11-19')).toBe(4); // Thursday
    expect(dowOf('2026-11-22')).toBe(0); // Sunday
  });

  it('knows month lengths', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 11)).toBe(30);
  });

  it('formats a short date', () => {
    expect(shortDate('2026-12-01')).toBe('1 Dec');
  });
});
