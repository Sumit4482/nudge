/** One day of anchor taps, for learning your real times. Minutes since midnight. */
export interface AnchorDay {
  date: string;
  /** Weekend, travel and sick days are not used for learning. */
  free?: boolean;
  wake?: number;
  leave?: number;
  home?: number;
  sleep?: number;
}

export const MIN_SAMPLES = 10;
export const LEARN_WINDOW = 14;

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const round5 = (n: number) => Math.round(n / 5) * 5;

export interface Learned {
  /** How many usable weekdays were found in the window. */
  samples: number;
  leave?: number;
  home?: number;
}

/** Median leave and home of your last 14 weekdays. Needs 10 weekdays with both taps. */
export function learnedTimes(log: AnchorDay[]): Learned {
  const days = log
    .filter((d) => !d.free && d.leave != null && d.home != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-LEARN_WINDOW);
  if (days.length < MIN_SAMPLES) return { samples: days.length };
  return {
    samples: days.length,
    leave: round5(median(days.map((d) => d.leave!))),
    home: round5(median(days.map((d) => d.home!))),
  };
}
