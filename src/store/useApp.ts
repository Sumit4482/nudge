import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { gardenStage, STAGE_NAMES } from '../garden';
import { addDays, dowOf } from '../lib/dates';
import type { RestMode } from '../lib/copy';
import { choreFor, type Bill } from '../life/logic';
import type { AnchorDay } from '../planner/learned';
import { guessTag } from '../planner/rules';
import { rollover } from '../planner/rollover';
import { leveledUp, level, praiseLine, rollBonus, xpFor, REWARD_GOAL_XP, type RewardPill, type RewardSummary } from '../rewards';
import { applyPenalty, missedStakes } from '../stakes';
import { nextStatus, reviewDates, reviewTitle } from '../study/logic';
import type { AnchorKey, Anchors, Tag, Task } from '../types';
import { seedBills, seedGoals, seedStudy, seedTasks, type Goal, type StudyState } from './seed';

/** One finished task or paid bill. */
export interface DoneItem {
  id: string;
  taskId: string;
  title: string;
  tag: Tag;
  xp: number;
  mins: number;
  /** Local date, YYYY-MM-DD. */
  date: string;
  at: number;
  proofUri?: string;
  /** A voice note recorded as proof (teach it back). */
  audioUri?: string;
  shared?: boolean;
}

/** The one task being worked on right now. Survives the app being closed. */
export interface ActiveRun {
  taskId: string;
  title: string;
  mins: number;
  /** Length of this run in minutes (5 for "Just 5 minutes"). */
  runMins: number;
  step: number;
  /** Epoch ms when the run started. */
  startAt: number;
  /** True for a 25 minute Pomodoro run. */
  pomodoro?: boolean;
}

/** The weekly reward you are working toward. */
export interface RewardGoal {
  name: string;
  goal: number;
}

export interface NewTask {
  title: string;
  mins: number;
  must: boolean;
  stake?: boolean;
  trigger?: Task['trigger'];
  steps?: string[];
}

export interface ActivityItem {
  at: number;
  text: string;
}

export interface PendingStake {
  titles: string[];
  loss: number;
}

/** A proof waiting to be posted to the public wall. */
export interface WallItem {
  id: string;
  photoUri: string;
  title: string;
  tag: Tag;
  mins: number;
  xp: number;
  /** ISO time before which it stays hidden on the site. */
  publishAt: string;
}

/** What you can change on a task or routine. Setting `days` clears `everyDays` and the other way round. */
export type TaskEdit = Partial<Pick<Task, 'title' | 'mins' | 'tag' | 'must' | 'pref' | 'steps' | 'days' | 'everyDays' | 'stake'>>;

export interface NewRoutine {
  title: string;
  mins: number;
  tag: Tag;
  must: boolean;
  pref: Task['pref'];
  days?: number[];
  everyDays?: number;
  steps?: string[];
}

export interface WorkoutTemplate {
  name: string;
  mins: number;
  ex: string[];
}

interface AppState {
  tasks: Task[];
  /** Today's anchor taps. Cleared when the date changes. */
  anchors: Anchors;
  /** The local date the anchors belong to. */
  date: string;
  done: DoneItem[];
  xp: number;
  streak: number;
  rest: RestMode;
  /** Last day of rest mode, YYYY-MM-DD, or '' for no end. */
  restUntil: string;
  /** Dev and demo: pretend it is this time. */
  nowOverride: number | null;
  dowOverride: number | null;
  active: ActiveRun | null;
  reward: RewardGoal;
  /** Shown by the reward screen right after a proof is saved. Not saved to disk. */
  lastReward: RewardSummary | null;

  anchorLog: AnchorDay[];
  learned: boolean;
  water: { date: string; glasses: number };
  snoozes: Record<string, { date: string; n: number }>;
  choreOffset: number;
  bills: Bill[];
  study: StudyState;
  goals: Goal[];
  activity: ActivityItem[];
  /** Missed stakes waiting to be shown after you tap sleep. */
  pendingStake: PendingStake | null;
  /** The date the last end-of-day rollover ran for. */
  rollDate: string;
  /** Photos waiting to be uploaded to the proof wall. */
  wallQueue: WallItem[];
  /** Minutes a proof waits before it shows on the public wall. */
  wallDelay: number;
  /** When you last looked at your cheers, so new ones can be counted. */
  cheersSeen: string;
  /** The last thing that happened with the proof wall, shown in Settings so a problem is never silent. */
  wallNote: string;

  ensureToday: (today: string) => void;
  tapAnchor: (key: AnchorKey, now: number) => void;
  /**
   * Correct an anchor you already tapped, or set one you forgot to tap, at a past time of today.
   * Returns an error message if the time does not fit, or null on success.
   */
  setAnchor: (key: AnchorKey, minutes: number, now: number) => string | null;
  /** Undo a tap. Returns false for Sleep once the day has been closed, since tasks were already rolled. */
  clearAnchor: (key: AnchorKey) => boolean;
  addTask: (input: NewTask) => string;
  setRoutineOff: (id: string, off: boolean) => void;
  /** Change a task or routine. Returns false if the edit is not valid (empty title). */
  updateTask: (id: string, patch: TaskEdit) => boolean;
  addRoutine: (input: NewRoutine) => string | null;
  setRest: (mode: RestMode, days?: number | null) => void;
  setRestUntilDays: (days: number | null) => void;
  setOverride: (now: number | null, dow: number | null) => void;
  resetDay: () => void;
  startRun: (taskId: string, runMins: number, pomodoro?: boolean) => ActiveRun | null;
  nextStep: () => void;
  extendRun: (mins: number) => void;
  /** Finish the active task with proof. Returns the reward summary, or null if nothing was active. */
  completeActive: (proof: { photo?: string; audio?: string }, shared?: boolean) => RewardSummary | null;
  /** Give XP for something that is not a task (a paid bill, a teach-it-back note). */
  award: (input: { title: string; tag: Tag; xp: number; photo?: string; audio?: string }) => RewardSummary;
  setReward: (r: RewardGoal) => void;
  clearReward: () => void;

  /** Returns 'ok', or 'blocked' when the day's two snoozes are used up. */
  snooze: (taskId: string, now: number) => 'ok' | 'blocked';
  moveTomorrow: (taskId: string, reason?: string) => void;
  recordReason: (taskId: string, reason: string) => void;
  setSteps: (taskId: string, steps: string[]) => void;
  dropTask: (taskId: string) => void;
  setStake: (taskId: string, on: boolean) => void;
  pinTask: (taskId: string, start: number | null) => void;
  tapWater: (date: string) => number;
  rotateChores: () => void;
  addWorkout: (t: WorkoutTemplate) => string;
  payBill: (billId: string, dueDate: string, photo?: string) => RewardSummary | null;
  cycleChapter: (subject: string, index: number) => void;
  addSubject: (name: string) => boolean;
  removeSubject: (name: string) => void;
  addTopic: (subject: string, name: string) => boolean;
  removeTopic: (subject: string, index: number) => void;
  /** Set or clear a subject's exam (or target) date, YYYY-MM-DD. */
  setExam: (subject: string, date: string | null) => void;
  saveGoal: (goal: Omit<Goal, 'id'> & { id?: string }) => string;
  removeGoal: (id: string) => void;
  saveBill: (bill: Omit<Bill, 'id'> & { id?: string }) => string;
  removeBill: (id: string) => void;
  setLearned: (on: boolean) => void;
  logActivity: (text: string) => void;
  dismissPendingStake: () => void;
  dequeueWall: (id: string) => void;
  setWallDelay: (minutes: number) => void;
  markCheersSeen: (at: string) => void;
  setWallNote: (text: string) => void;
  unshareDone: (id: string) => void;
}

const initial = () => ({
  tasks: seedTasks(),
  anchors: {} as Anchors,
  date: '',
  done: [] as DoneItem[],
  xp: 0,
  streak: 0,
  rest: 'normal' as RestMode,
  restUntil: '',
  nowOverride: null,
  dowOverride: null,
  active: null as ActiveRun | null,
  reward: { name: 'Movie night', goal: REWARD_GOAL_XP } as RewardGoal,
  lastReward: null as RewardSummary | null,
  anchorLog: [] as AnchorDay[],
  learned: false,
  water: { date: '', glasses: 0 },
  snoozes: {} as Record<string, { date: string; n: number }>,
  choreOffset: 0,
  bills: seedBills(),
  study: seedStudy(),
  goals: seedGoals(),
  activity: [] as ActivityItem[],
  pendingStake: null as PendingStake | null,
  rollDate: '',
  wallQueue: [] as WallItem[],
  wallDelay: 0,
  cheersSeen: '',
  wallNote: '',
});

/** A short unique id, safe even if two are made in the same millisecond. */
const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const ANCHOR_ORDER: AnchorKey[] = ['wake', 'leave', 'home', 'sleep'];
const fmtTime = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Earliest and latest minute an anchor can take, given the others that are already set. */
function anchorBounds(anchors: Anchors, key: AnchorKey): { lower: number; upper: number } {
  const i = ANCHOR_ORDER.indexOf(key);
  const before = ANCHOR_ORDER.slice(0, i).map((k) => anchors[k]).filter((v): v is number => v != null);
  const after = ANCHOR_ORDER.slice(i + 1).map((k) => anchors[k]).filter((v): v is number => v != null);
  return { lower: before.length ? Math.max(...before) : 0, upper: after.length ? Math.min(...after) : 1439 };
}

/** Write one anchor time into today's history row (or clear it with null). */
function updateLog(log: AnchorDay[], date: string, s: { rest: RestMode }, key: AnchorKey, t: number | null): AnchorDay[] {
  const dow = dowOf(date || '2026-01-05');
  const free = s.rest !== 'normal' || dow === 0 || dow === 6;
  const idx = log.findIndex((d) => d.date === date);
  const next = [...log];
  if (t == null) {
    if (idx >= 0) {
      const { [key]: _gone, ...rest } = next[idx];
      next[idx] = rest as AnchorDay;
    }
    return next;
  }
  const entry = bump(idx >= 0 ? next[idx] : undefined, date, free, key, t);
  if (idx >= 0) next[idx] = entry;
  else next.push(entry);
  return next.slice(-60);
}

/** Record an anchor at time t. Sleep also closes the day: skipped tasks roll over and missed stakes cost XP. */
function applyAnchor(s: AppState, key: AnchorKey, t: number): Partial<AppState> {
  const anchors = { ...s.anchors, [key]: t };
  const dow = dowOf(s.date || '2026-01-05');
  const base = { anchors, anchorLog: updateLog(s.anchorLog, s.date, s, key, t) };
  if (key !== 'sleep') return base;
  const rest = s.rest !== 'normal';
  const missed = rest ? [] : missedStakes(s.tasks, dow, s.date);
  const xp = missed.length ? applyPenalty(s.xp, missed.length) : s.xp;
  return {
    ...base,
    tasks: rollover(s.tasks, dow, rest, s.date),
    xp,
    pendingStake: missed.length ? { titles: missed.map((m) => m.title), loss: s.xp - xp } : s.pendingStake,
    rollDate: s.date,
  };
}

const clampMins = (m: number) => Math.min(480, Math.max(1, Math.round(m)));
const cleanSteps = (steps: string[]) => steps.map((x) => x.trim().slice(0, 160)).filter(Boolean);

/** Today's rotating chore, as a task. Removed in rest mode and on weekends. */
function withChore(tasks: Task[], dow: number, offset: number, rest: boolean): Task[] {
  const rest0 = tasks.filter((t) => !t.chore);
  const name = rest ? null : choreFor(dow, offset);
  if (!name) return rest0;
  return [
    ...rest0,
    { id: 'chore', title: `Chore: ${name}`, mins: 15, tag: 'life', must: false, prio: 1, pref: 'evening', days: [dow], chore: true, rolled: 0 },
  ];
}

const bump = (day: AnchorDay | undefined, date: string, free: boolean, key: AnchorKey, t: number): AnchorDay => ({ ...(day ?? { date }), date, free, [key]: t });

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial(),

      ensureToday: (today) =>
        set((s) => {
          if (s.date === today) return s;
          let tasks = s.tasks;
          let xp = s.xp;
          let pendingStake = s.pendingStake;
          let anchorLog = s.anchorLog;
          const prev = s.date;
          const rest = s.rest !== 'normal';
          // The day ended without a sleep tap: do the end-of-day work now.
          if (prev && s.rollDate !== prev) {
            const pdow = dowOf(prev);
            const missed = rest ? [] : missedStakes(tasks, pdow, prev);
            if (missed.length) {
              xp = applyPenalty(xp, missed.length);
              pendingStake = { titles: missed.map((t) => t.title), loss: s.xp - xp };
            }
            tasks = rollover(tasks, pdow, rest, prev);
            // No bedtime tap: the day closes by itself at 00:00 and that is logged as the sleep time.
            if (!s.anchorLog.find((d) => d.date === prev)?.sleep) anchorLog = updateLog(anchorLog, prev, s, 'sleep', 1440);
          }
          // A new day: finished one-off tasks go away, routines come back.
          tasks = tasks
            .filter((t) => t.routine || t.chore || !t.done)
            .map((t) => ({ ...t, done: false, tomorrow: false, pinnedStart: null, extraDay: t.extraDay && t.extraDay >= today ? t.extraDay : undefined }));
          // Rest mode ends by itself after its last day.
          const ended = s.rest !== 'normal' && !!s.restUntil && today > s.restUntil;
          const nextRest: RestMode = ended ? 'normal' : s.rest;
          tasks = withChore(tasks, dowOf(today), s.choreOffset, nextRest !== 'normal');
          return {
            date: today,
            anchors: {},
            tasks,
            xp,
            pendingStake,
            anchorLog,
            rest: nextRest,
            restUntil: ended ? '' : s.restUntil,
            rollDate: prev || s.rollDate,
            snoozes: {},
          };
        }),

      tapAnchor: (key, now) =>
        set((s) => {
          if (s.anchors[key] != null) return s;
          // An anchor is never earlier than the previous anchor or the current time.
          return applyAnchor(s, key, Math.max(now, ...Object.values(s.anchors)));
        }),

      setAnchor: (key, minutes, now) => {
        const s = get();
        const m = Math.round(minutes);
        const { lower, upper } = anchorBounds(s.anchors, key);
        if (m < lower) return `That is before ${fmtTime(lower)}, the step before it.`;
        if (m > upper) return `That is after ${fmtTime(upper)}, the step after it.`;
        if (m > now) return 'That time has not happened yet.';
        if (s.anchors[key] == null) {
          set((st) => applyAnchor(st, key, m));
          return null;
        }
        // Already tapped: only move the time. Bedtime work already ran, so Sleep changes the logged time only.
        set((st) => ({ anchors: { ...st.anchors, [key]: m }, anchorLog: updateLog(st.anchorLog, st.date, st, key, m) }));
        return null;
      },

      clearAnchor: (key) => {
        const s = get();
        if (s.anchors[key] == null) return true;
        if (key === 'sleep') return false;
        const { [key]: _gone, ...anchors } = s.anchors;
        set({ anchors, anchorLog: updateLog(s.anchorLog, s.date, s, key, null) });
        return true;
      },

      addTask: ({ title, mins, must, stake, trigger, steps }) => {
        const id = uid('t');
        set((s) => ({
          tasks: [
            ...s.tasks,
            { id, title: title.trim(), mins, tag: guessTag(title), must, prio: must ? 3 : 2, pref: 'any', rolled: 0, steps, stake, trigger },
          ],
        }));
        return id;
      },

      setRoutineOff: (id, off) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, off } : t)) })),

      updateTask: (id, patch) => {
        const title = patch.title === undefined ? undefined : patch.title.trim();
        if (title === '') return false;
        let ok = false;
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t;
            ok = true;
            const next: Task = { ...t, ...patch };
            if (title !== undefined) next.title = title.slice(0, 80);
            if (patch.mins !== undefined) next.mins = clampMins(patch.mins);
            if (patch.must !== undefined) next.prio = patch.must ? 3 : t.prio === 3 ? 2 : t.prio;
            if (patch.steps !== undefined) next.steps = cleanSteps(patch.steps);
            if (patch.days !== undefined) {
              next.days = [...new Set(patch.days.filter((d) => d >= 0 && d <= 6))].sort();
              if (next.days.length === 0 || next.days.length === 7) delete next.days;
              delete next.everyDays;
            }
            if (patch.everyDays !== undefined) {
              if (patch.everyDays >= 1) {
                next.everyDays = Math.min(60, Math.round(patch.everyDays));
                delete next.days;
              } else {
                delete next.everyDays;
              }
            }
            return next;
          }),
        }));
        return ok;
      },

      addRoutine: (input) => {
        const title = input.title.trim().slice(0, 80);
        if (!title) return null;
        const id = uid('r');
        const task: Task = { id, title, mins: clampMins(input.mins), tag: input.tag, must: input.must, prio: input.must ? 3 : 2, pref: input.pref, routine: true, rolled: 0, steps: cleanSteps(input.steps ?? []) };
        if (input.everyDays && input.everyDays >= 1) task.everyDays = Math.min(60, Math.round(input.everyDays));
        else if (input.days?.length && input.days.length < 7) task.days = [...new Set(input.days.filter((d) => d >= 0 && d <= 6))].sort();
        set((s) => ({ tasks: [...s.tasks, task] }));
        return id;
      },

      setRest: (mode, days) =>
        set((s) => {
          const today = s.date || '';
          const until = mode === 'normal' || days == null || !today ? '' : addDays(today, days);
          return { rest: mode, restUntil: until, tasks: withChore(s.tasks, dowOf(today || '2026-01-05'), s.choreOffset, mode !== 'normal') };
        }),

      setRestUntilDays: (days) => set((s) => ({ restUntil: days == null || !s.date ? '' : addDays(s.date, days) })),

      setOverride: (now, dow) => set({ nowOverride: now, dowOverride: dow }),

      resetDay: () => set((s) => ({ ...initial(), nowOverride: s.nowOverride, dowOverride: s.dowOverride, date: s.date })),

      startRun: (taskId, runMins, pomodoro) => {
        const s = get();
        const t = s.tasks.find((x) => x.id === taskId);
        // One active task at a time.
        if (!t || (s.active && s.active.taskId !== taskId)) return null;
        const next: ActiveRun = s.active
          ? { ...s.active, runMins, startAt: Date.now(), pomodoro }
          : { taskId, title: t.title, mins: t.mins, runMins, step: 0, startAt: Date.now(), pomodoro };
        set({ active: next });
        return next;
      },

      nextStep: () =>
        set((s) => {
          if (!s.active) return s;
          const t = s.tasks.find((x) => x.id === s.active!.taskId);
          const last = (t?.steps?.length ?? 1) - 1;
          return { active: { ...s.active, step: Math.min(last, s.active.step + 1) } };
        }),

      extendRun: (mins) => set((s) => (s.active ? { active: { ...s.active, runMins: mins, startAt: Date.now() } } : s)),

      completeActive: (proof, shared) => {
        const s = get();
        const a = s.active;
        const t = a && s.tasks.find((x) => x.id === a.taskId);
        if (!a || !t) return null;
        const base = xpFor(t);
        const bonus = rollBonus();
        const gained = base + bonus;
        const newXp = s.xp + gained;
        const firstToday = !s.done.some((d) => d.date === s.date);
        // The streak grows on the first finished task of a day, but stays frozen while resting.
        const streakUp = firstToday && s.rest === 'normal';
        const streak = streakUp ? s.streak + 1 : s.streak;
        const extras: RewardPill[] = [];
        if (gardenStage(streak) > gardenStage(s.streak)) extras.push({ icon: 'leaf-outline', text: `Garden grew: ${STAGE_NAMES[gardenStage(streak)]}`, gold: true });
        if (t.stake) extras.push({ icon: 'shield-checkmark-outline', text: 'Stake kept' });
        if (shared) extras.push({ icon: 'image-outline', text: 'On your wall soon' });

        let tasks = s.tasks.map((x) => (x.id === t.id ? { ...x, done: true, lastDone: s.date } : x));
        // Finishing a chapter task sets reviews at +1, +3 and +7 days. Reviews never make more reviews.
        if (t.chapter && !t.review) {
          const reviews: Task[] = reviewDates(s.date).map((d, i) => ({
            id: `rv${Date.now()}${i}`,
            title: reviewTitle(t.title),
            mins: 10,
            tag: 'study',
            must: false,
            prio: 2,
            pref: 'any',
            rolled: 0,
            review: true,
            subject: t.subject,
            dueDate: d,
          }));
          tasks = [...tasks, ...reviews];
          extras.push({ icon: 'repeat', text: 'Reviews set: +1, +3, +7 days' });
        }
        const minutes = { ...s.study.minutes };
        if (t.subject) {
          const bySubject = { ...(minutes[t.subject] ?? {}) };
          bySubject[s.date] = (bySubject[s.date] ?? 0) + t.mins;
          minutes[t.subject] = bySubject;
        }
        const summary: RewardSummary = {
          title: t.title,
          tag: t.tag,
          base,
          bonus,
          oldXp: s.xp,
          newXp,
          streakUp,
          streak,
          levelUp: leveledUp(s.xp, newXp),
          level: level(newXp),
          praise: praiseLine(t.tag),
          extras,
        };
        const doneId = `d${Date.now()}`;
        const wallQueue =
          shared && proof.photo
            ? [...s.wallQueue, { id: doneId, photoUri: proof.photo, title: t.title, tag: t.tag, mins: t.mins, xp: gained, publishAt: new Date(Date.now() + s.wallDelay * 60000).toISOString() }]
            : s.wallQueue;
        set({
          wallQueue,
          tasks,
          done: [
            ...s.done,
            { id: doneId, taskId: t.id, title: t.title, tag: t.tag, xp: gained, mins: t.mins, date: s.date, at: Date.now(), proofUri: proof.photo, audioUri: proof.audio, shared },
          ],
          xp: newXp,
          streak,
          active: null,
          lastReward: summary,
          study: { ...s.study, minutes },
        });
        return summary;
      },

      award: ({ title, tag, xp, photo, audio }) => {
        const s = get();
        const newXp = s.xp + xp;
        const summary: RewardSummary = {
          title,
          tag,
          base: xp,
          bonus: 0,
          oldXp: s.xp,
          newXp,
          streakUp: false,
          streak: s.streak,
          levelUp: leveledUp(s.xp, newXp),
          level: level(newXp),
          praise: praiseLine(tag),
          extras: [],
        };
        set({
          xp: newXp,
          done: [...s.done, { id: `d${Date.now()}`, taskId: `x${Date.now()}`, title, tag, xp, mins: 0, date: s.date, at: Date.now(), proofUri: photo, audioUri: audio }],
          lastReward: summary,
        });
        return summary;
      },

      setReward: (reward) => set({ reward }),

      clearReward: () => set({ lastReward: null }),

      snooze: (taskId, now) => {
        const s = get();
        const cur = s.snoozes[taskId];
        const n = cur && cur.date === s.date ? cur.n : 0;
        if (n >= 2) return 'blocked';
        set({
          snoozes: { ...s.snoozes, [taskId]: { date: s.date, n: n + 1 } },
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, pinnedStart: Math.ceil((now + 15) / 5) * 5 } : t)),
        });
        return 'ok';
      },

      moveTomorrow: (taskId, reason) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, tomorrow: true, extraDay: s.date ? addDays(s.date, 1) : undefined, pinnedStart: null, rolled: reason === 'tired' ? t.rolled : t.rolled + 1, reasons: reason ? [...(t.reasons ?? []), reason] : t.reasons, whyAsked: true }
              : t,
          ),
        })),

      recordReason: (taskId, reason) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, reasons: [...(t.reasons ?? []), reason], whyAsked: true } : t)) })),

      setSteps: (taskId, steps) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, steps, rolled: 0 } : t)) })),

      dropTask: (taskId) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) })),

      setStake: (taskId, on) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, stake: on } : t)) })),

      pinTask: (taskId, start) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, pinnedStart: start } : t)) })),

      tapWater: (date) => {
        const s = get();
        const glasses = Math.min(12, (s.water.date === date ? s.water.glasses : 0) + 1);
        set({ water: { date, glasses } });
        return glasses;
      },

      rotateChores: () =>
        set((s) => {
          const choreOffset = (s.choreOffset + 1) % 5;
          return { choreOffset, tasks: withChore(s.tasks, dowOf(s.date || '2026-01-05'), choreOffset, s.rest !== 'normal') };
        }),

      addWorkout: (t) => {
        const id = `t${Date.now()}`;
        set((s) => ({
          tasks: [...s.tasks, { id, title: `Workout: ${t.name}`, mins: t.mins, tag: 'fit', must: true, prio: 3, pref: 'morning', rolled: 0, steps: t.ex }],
        }));
        return id;
      },

      payBill: (billId, dueDate, photo) => {
        const s = get();
        const bill = s.bills.find((b) => b.id === billId);
        if (!bill) return null;
        set({ bills: s.bills.map((b) => (b.id === billId ? { ...b, paidFor: dueDate } : b)) });
        return get().award({ title: `Paid: ${bill.title}`, tag: 'life', xp: 15, photo });
      },

      cycleChapter: (subject, index) =>
        set((s) => {
          const list = (s.study.chapters[subject] ?? []).map((c, i) => (i === index ? { ...c, s: nextStatus(c.s) } : c));
          return { study: { ...s.study, chapters: { ...s.study.chapters, [subject]: list } } };
        }),

      addSubject: (name) => {
        const n = name.trim().slice(0, 40);
        if (!n || get().study.subjects.some((x) => x.toLowerCase() === n.toLowerCase())) return false;
        set((s) => ({ study: { ...s.study, subjects: [...s.study.subjects, n], chapters: { ...s.study.chapters, [n]: [] } } }));
        return true;
      },

      removeSubject: (name) =>
        set((s) => {
          const { [name]: _gone, ...chapters } = s.study.chapters;
          return { study: { ...s.study, subjects: s.study.subjects.filter((x) => x !== name), chapters, exams: s.study.exams.filter((e) => e.subject !== name) } };
        }),

      addTopic: (subject, name) => {
        const n = name.trim().slice(0, 80);
        const list = get().study.chapters[subject];
        if (!n || !list || list.some((c) => c.name.toLowerCase() === n.toLowerCase())) return false;
        set((s) => ({ study: { ...s.study, chapters: { ...s.study.chapters, [subject]: [...list, { name: n, s: 0 }] } } }));
        return true;
      },

      removeTopic: (subject, index) =>
        set((s) => ({ study: { ...s.study, chapters: { ...s.study.chapters, [subject]: (s.study.chapters[subject] ?? []).filter((_, i) => i !== index) } } })),

      setExam: (subject, date) =>
        set((s) => {
          const rest = s.study.exams.filter((e) => e.subject !== subject);
          return { study: { ...s.study, exams: date ? [...rest, { subject, date }].sort((a, b) => a.date.localeCompare(b.date)) : rest } };
        }),

      saveGoal: (goal) => {
        const id = goal.id ?? uid('g');
        const g: Goal = { ...goal, id, title: goal.title.trim().slice(0, 60) || 'My goal', target: Math.max(1, Math.round(goal.target)) };
        set((s) => ({ goals: s.goals.some((x) => x.id === id) ? s.goals.map((x) => (x.id === id ? g : x)) : [...s.goals, g] }));
        return id;
      },

      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      saveBill: (bill) => {
        const id = bill.id ?? uid('b');
        const b: Bill = { ...bill, id, title: bill.title.trim().slice(0, 60) || 'Bill', dueDay: Math.min(31, Math.max(1, Math.round(bill.dueDay))) };
        set((s) => ({ bills: s.bills.some((x) => x.id === id) ? s.bills.map((x) => (x.id === id ? b : x)) : [...s.bills, b] }));
        return id;
      },

      removeBill: (id) => set((s) => ({ bills: s.bills.filter((b) => b.id !== id) })),

      setLearned: (on) => set({ learned: on }),

      logActivity: (text) => set((s) => ({ activity: [...s.activity, { at: Date.now(), text }].slice(-200) })),

      dismissPendingStake: () => set({ pendingStake: null }),

      dequeueWall: (id) => set((s) => ({ wallQueue: s.wallQueue.filter((w) => w.id !== id) })),

      markCheersSeen: (at) => set({ cheersSeen: at }),

      setWallNote: (text) => set({ wallNote: `${new Date().toTimeString().slice(0, 5)} ${text}`.slice(0, 300) }),

      setWallDelay: (minutes) => set({ wallDelay: Math.max(0, Math.min(240, minutes)) }),

      unshareDone: (id) => set((s) => ({ done: s.done.map((d) => (d.id === id ? { ...d, shared: false } : d)), wallQueue: s.wallQueue.filter((w) => w.id !== id) })),
    }),
    {
      name: 'nudge-state-v3',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        tasks: s.tasks,
        anchors: s.anchors,
        date: s.date,
        done: s.done,
        xp: s.xp,
        streak: s.streak,
        rest: s.rest,
        restUntil: s.restUntil,
        active: s.active,
        reward: s.reward,
        anchorLog: s.anchorLog,
        learned: s.learned,
        water: s.water,
        snoozes: s.snoozes,
        choreOffset: s.choreOffset,
        bills: s.bills,
        study: s.study,
        goals: s.goals,
        activity: s.activity,
        pendingStake: s.pendingStake,
        rollDate: s.rollDate,
        wallQueue: s.wallQueue,
        wallDelay: s.wallDelay,
        cheersSeen: s.cheersSeen,
        wallNote: s.wallNote,
      }),
    },
  ),
);

/** True once the saved state has been read from disk. */
export function whenHydrated(cb: () => void): () => void {
  if (useApp.persist.hasHydrated()) {
    cb();
    return () => {};
  }
  return useApp.persist.onFinishHydration(cb);
}
