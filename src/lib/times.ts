import type { DefaultTimes } from '../types';

/** Your usual day, used until you tap an anchor. Minutes since midnight. The planner keeps its own generic defaults. */
export const MY_TIMES: DefaultTimes = {
  wake: 390, // 06:30
  leave: 600, // 10:00
  officeStart: 660, // 11:00
  home: 1185, // 19:45
  sleep: 1350, // 22:30
};
