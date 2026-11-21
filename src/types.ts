export type Tag = 'fit' | 'study' | 'life';
export type AnchorKey = 'wake' | 'leave' | 'home' | 'sleep';
export type WinId = 'm' | 'a' | 'e';

export interface Task {
  id: string;
  title: string;
  /** Planned length in minutes. */
  mins: number;
  tag: Tag;
  /** At most 3 per day. */
  must: boolean;
  prio: 1 | 2 | 3;
  pref: 'morning' | 'evening' | 'any';
  /** 0 = Sunday .. 6 = Saturday. Empty or missing = any day. */
  days?: number[];
  routine?: boolean;
  /** Repeats this many days after it was last finished, instead of on fixed weekdays. */
  everyDays?: number;
  /** Local date (YYYY-MM-DD) this task was last finished. Used by everyDays. */
  lastDone?: string;
  /** A one-time extra due date, set by Move to tomorrow, so a weekday routine still shows up on the day it was moved to. */
  extraDay?: string;
  chore?: boolean;
  /** Broken-down steps. */
  steps?: string[];
  done?: boolean;
  /** Routine paused by the user. */
  off?: boolean;
  /** Times this task moved to a later day. */
  rolled: number;
  /** Fixed start (minutes since midnight) set by dragging. */
  pinnedStart?: number | null;
  /** Moved to tomorrow by the user. */
  tomorrow?: boolean;
  stake?: boolean;
  trigger?: { when: 'wake' | 'leave' | 'home' };
  subject?: string;
  /** Counts toward the exam: finishing it creates spaced reviews. */
  chapter?: boolean;
  /** A short review created by spaced repetition. */
  review?: boolean;
  /** Local date (YYYY-MM-DD) before which this task is not due. */
  dueDate?: string;
  /** Why the user avoided it, in order. */
  reasons?: string[];
  /** The avoiding prompt has already been shown for this task. */
  whyAsked?: boolean;
}

/** Minutes since midnight. */
export type Anchors = Partial<Record<AnchorKey, number>>;

/** A calendar event, in minutes since midnight. */
export interface Busy {
  s: number;
  e: number;
  title?: string;
}

export type Block =
  | { kind: 'task'; t: Task; s: number; e: number; w: WinId; pred: boolean; pinned?: boolean }
  | { kind: 'free'; s: number; e: number; w: WinId; i: number; pred: boolean }
  | { kind: 'busy'; s: number; e: number; title: string; i: number }
  | { kind: 'office'; s: number; e: number; done: boolean; active: boolean; pred: boolean }
  | { kind: 'now'; s: number };

export interface DefaultTimes {
  wake: number;
  leave: number;
  officeStart: number;
  home: number;
  sleep: number;
}

export interface PlanInput {
  tasks: Task[];
  anchors: Anchors;
  /** Minutes since midnight. */
  now: number;
  /** 0 = Sunday .. 6 = Saturday. */
  dow: number;
  busy?: Busy[];
  /** Travel or Sick mode: plan like a free day, skip routines and chores. */
  rest?: boolean;
  /** Local date, YYYY-MM-DD. Tasks with a later dueDate are left out. */
  date?: string;
  /** Override the built-in defaults, for example with learned times. */
  defaults?: Partial<DefaultTimes>;
}

export interface PlanOutput {
  blocks: Block[];
  /** Tasks that did not fit or were moved to tomorrow. */
  later: Task[];
  /** Task id to the window it landed in: m, a, e, p (pinned) or later. */
  win: Record<string, WinId | 'p' | 'later'>;
  /** Only the task blocks, in time order. */
  placed: Extract<Block, { kind: 'task' }>[];
}

export interface Proof {
  taskId: string;
  /** Local file uri of the photo. */
  uri: string;
  at: number;
  xp: number;
  shared?: boolean;
}

export interface DayState {
  /** Local date as YYYY-MM-DD. */
  date: string;
  anchors: Anchors;
  doneIds: string[];
}
