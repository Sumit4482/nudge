import type { DefaultTimes } from '../types';

/** Used until the user taps an anchor. Minutes since midnight. */
export const DEFAULT_TIMES: DefaultTimes = {
  wake: 450, // 07:30
  leave: 615, // 10:15
  officeStart: 660, // 11:00
  home: 1170, // 19:30
  sleep: 1410, // 23:30
};

/** Time to get ready after waking or arriving home, and before leaving. */
export const READY_BUFFER = 20;
/** Wind-down before the sleep anchor. */
export const SLEEP_BUFFER = 30;
/** Gap after every task. */
export const TASK_GAP = 10;
/** Windows shorter than this are dropped. */
export const MIN_WINDOW = 10;
/** Leftover time at least this long becomes a free block. */
export const MIN_FREE = 25;
/** Tasks this long or longer go to the largest remaining window. */
export const BIG_TASK = 40;
