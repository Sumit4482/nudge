import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined },
}));

import { upcomingDue } from '../life/logic';
import { learnedTimes } from '../planner/learned';
import { demoBills, demoGoals, demoStudy, demoTasks } from './demoSeed';
import { buildPlan } from './selectors';
import { useApp } from './useApp';

const get = () => useApp.getState();
const FRI = '2026-11-20'; // a Friday: workout and a chore day
const SAT = '2026-11-21';

/** Start each test from a fresh app on a known day, with no bonus XP rolls. */
function fresh(date = FRI) {
  useApp.setState({ ...useApp.getInitialState(), tasks: demoTasks(), study: demoStudy(), bills: demoBills(), goals: demoGoals(), xp: 1240, streak: 6 }, true);
  get().ensureToday(date);
}

const planFor = (now: number, dow: number, date: string) => buildPlan(get(), now, dow, date);

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.9); // no bonus drop
});
afterEach(() => vi.restoreAllMocks());

describe('a new day', () => {
  it('starts clean with routines back and today\'s chore added', () => {
    fresh();
    expect(get().date).toBe(FRI);
    expect(get().anchors).toEqual({});
    const chore = get().tasks.find((t) => t.chore);
    expect(chore?.title).toBe('Chore: Desk and cables reset');
    expect(get().tasks.some((t) => t.id === 'workout')).toBe(true);
  });

  it('has no chore on a weekend', () => {
    fresh(SAT);
    expect(get().tasks.some((t) => t.chore)).toBe(false);
  });
});

describe('anchors and the plan', () => {
  it('wake, leave and home re-plan the day', () => {
    fresh();
    get().tapAnchor('wake', 462);
    let p = planFor(470, 5, FRI);
    expect(p.placed.find((b) => b.t.id === 'workout')).toMatchObject({ s: 482, w: 'm' });

    get().tapAnchor('leave', 620);
    p = planFor(625, 5, FRI);
    expect(p.placed.every((b) => b.w === 'e')).toBe(true);
    expect(p.placed.every((b) => b.pred)).toBe(true);

    get().tapAnchor('home', 1060);
    p = planFor(1060, 5, FRI);
    expect(p.placed[0]).toMatchObject({ s: 1080, pred: false });
  });

  it('an anchor is never earlier than the previous one', () => {
    fresh();
    get().tapAnchor('wake', 480);
    get().tapAnchor('leave', 400);
    expect(get().anchors.leave).toBe(480);
  });

  it('tapping the same anchor twice changes nothing', () => {
    fresh();
    get().tapAnchor('wake', 480);
    get().tapAnchor('wake', 600);
    expect(get().anchors.wake).toBe(480);
  });

  it('logs anchors for learning and learns your times after 10 weekdays', () => {
    fresh();
    for (let i = 1; i <= 10; i++) {
      get().ensureToday(`2026-12-${String(i).padStart(2, '0')}`);
      // Skip weekends in the log by using weekdays only: Dec 1 2026 is a Tuesday.
      const dow = new Date(Date.UTC(2026, 11, i)).getUTCDay();
      if (dow === 0 || dow === 6) continue;
      get().tapAnchor('leave', 600);
      get().tapAnchor('home', 1140);
    }
    const weekdays = get().anchorLog.filter((d) => !d.free);
    expect(weekdays.length).toBeGreaterThan(0);
    // Feed ten clean weekdays and check the median is used by the plan.
    useApp.setState({ anchorLog: Array.from({ length: 10 }, (_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, leave: 600, home: 1140 })) });
    expect(learnedTimes(get().anchorLog)).toMatchObject({ leave: 600, home: 1140 });
    useApp.setState({ learned: true });
    get().tapAnchor('wake', 462);
    const p = planFor(700, 5, get().date);
    expect(p.placed.find((b) => b.t.id === 'physics')?.s).toBe(1160); // home 19:00 + 20, not 19:50
  });
});

describe('adding tasks', () => {
  it('adds a staked task with an if-then plan and places it', () => {
    fresh();
    get().tapAnchor('wake', 462);
    const id = get().addTask({ title: 'Finish chemistry assignment', mins: 45, must: true, stake: true, trigger: { when: 'home' } });
    const t = get().tasks.find((x) => x.id === id)!;
    expect(t).toMatchObject({ tag: 'study', must: true, stake: true, trigger: { when: 'home' }, prio: 3, rolled: 0 });
    expect(planFor(470, 5, FRI).placed.some((b) => b.t.id === id)).toBe(true);
  });
});

describe('a focus run and proof', () => {
  it('runs one task at a time and finishes only through completeActive', () => {
    fresh();
    get().tapAnchor('wake', 462);
    expect(get().startRun('workout', 5)).not.toBeNull();
    expect(get().startRun('read', 5)).toBeNull(); // another task is active
    get().nextStep();
    get().nextStep();
    get().nextStep();
    get().nextStep(); // clamps at the last step (4 steps, index 3)
    expect(get().active?.step).toBe(3);
    get().extendRun(10);
    expect(get().active?.runMins).toBe(10);

    const r = get().completeActive({ photo: 'file:///proofs/a.jpg' })!;
    expect(r).toMatchObject({ base: 56, bonus: 0, newXp: 1240 + 56, streakUp: true, streak: 7 });
    expect(get().active).toBeNull();
    expect(get().tasks.find((t) => t.id === 'workout')?.done).toBe(true);
    expect(get().done[0]).toMatchObject({ proofUri: 'file:///proofs/a.jpg', xp: 56 });
    expect(get().lastReward?.title).toBe('Morning workout');
  });

  it('only the first finished task of a day grows the streak', () => {
    fresh();
    get().startRun('read', 5);
    get().completeActive({ photo: 'a' });
    get().startRun('plan', 5);
    const r = get().completeActive({ photo: 'b' })!;
    expect(r.streakUp).toBe(false);
    expect(get().streak).toBe(7);
  });

  it('a level up is reported', () => {
    fresh();
    useApp.setState({ xp: 495 });
    get().startRun('read', 5);
    expect(get().completeActive({ photo: 'a' })).toMatchObject({ levelUp: true, level: 2 });
  });

  it('a bonus drop is added when the dice say so', () => {
    fresh();
    (Math.random as unknown as ReturnType<typeof vi.fn>).mockReturnValue(0.1);
    get().startRun('read', 5);
    const r = get().completeActive({ photo: 'a' })!;
    expect(r.bonus).toBeGreaterThanOrEqual(15);
    expect(r.newXp).toBe(1240 + r.base + r.bonus);
  });

  it('finishing a chapter task sets three reviews, records minutes and grows the garden', () => {
    fresh();
    get().startRun('physics', 5);
    const r = get().completeActive({ photo: 'a' })!;
    const reviews = get().tasks.filter((t) => t.review);
    expect(reviews.map((t) => t.dueDate)).toEqual(['2026-11-21', '2026-11-23', '2026-11-27']);
    expect(reviews.every((t) => t.title === 'Review: Optics chapter 4' && t.mins === 10)).toBe(true);
    expect(r.extras.map((e) => e.text)).toContain('Reviews set: +1, +3, +7 days');
    expect(r.extras.some((e) => e.text.startsWith('Garden grew'))).toBe(true); // streak 6 to 7
    expect(get().study.minutes.Physics?.[FRI]).toBe(50);
    // Reviews wait until they are due.
    const tomorrowReview = reviews[0];
    expect(planFor(1200, 5, FRI).win[tomorrowReview.id]).toBeUndefined(); // not due yet
    expect(planFor(1200, 6, SAT).win[tomorrowReview.id]).toBeDefined(); // due: placed or waiting
    // Finishing a review does not make more reviews.
    get().ensureToday(SAT);
    const id = get().tasks.find((t) => t.review && t.dueDate === SAT)!.id;
    get().startRun(id, 5);
    get().completeActive({ photo: 'r' });
    expect(get().tasks.filter((t) => t.review && !t.done)).toHaveLength(2);
  });

  it('a staked task finished shows Stake kept', () => {
    fresh();
    get().setStake('read', true);
    get().startRun('read', 5);
    expect(get().completeActive({ photo: 'a' })!.extras.map((e) => e.text)).toContain('Stake kept');
  });

  it('shared proofs wait in the wall queue with the posting delay', () => {
    fresh();
    get().setWallDelay(45);
    get().startRun('read', 5);
    const before = Date.now();
    get().completeActive({ photo: 'file:///p.jpg' }, true);
    const q = get().wallQueue;
    expect(q).toHaveLength(1);
    expect(new Date(q[0].publishAt).getTime()).toBeGreaterThanOrEqual(before + 45 * 60000 - 2000);
    get().unshareDone(q[0].id);
    expect(get().wallQueue).toHaveLength(0);
    expect(get().done[0].shared).toBe(false);
  });

  it('private proofs never join the wall queue', () => {
    fresh();
    get().startRun('read', 5);
    get().completeActive({ photo: 'file:///p.jpg' }, false);
    expect(get().wallQueue).toHaveLength(0);
  });
});

describe('avoiding a task', () => {
  it('allows two snoozes, pinned 15 minutes later, then blocks', () => {
    fresh();
    expect(get().snooze('read', 1000)).toBe('ok');
    expect(get().tasks.find((t) => t.id === 'read')?.pinnedStart).toBe(1015);
    expect(get().snooze('read', 1010)).toBe('ok');
    expect(get().snooze('read', 1020)).toBe('blocked');
    // A new day resets the count.
    get().ensureToday(SAT);
    expect(get().snooze('read', 1000)).toBe('ok');
  });

  it('moving to tomorrow counts a skip, except when tired', () => {
    fresh();
    get().moveTomorrow('read', 'boring');
    expect(get().tasks.find((t) => t.id === 'read')).toMatchObject({ tomorrow: true, rolled: 1, reasons: ['boring'] });
    get().moveTomorrow('plan', 'tired');
    expect(get().tasks.find((t) => t.id === 'plan')).toMatchObject({ tomorrow: true, rolled: 0, reasons: ['tired'] });
    const p = planFor(1200, 5, FRI);
    expect(p.later.map((t) => t.id)).toEqual(expect.arrayContaining(['read', 'plan']));
  });

  it('splitting a task resets its skips; dropping removes it', () => {
    fresh();
    useApp.setState({ tasks: get().tasks.map((t) => (t.id === 'chem' ? { ...t, rolled: 3 } : t)) });
    get().setSteps('chem', ['a', 'b', 'c']);
    expect(get().tasks.find((t) => t.id === 'chem')).toMatchObject({ rolled: 0, steps: ['a', 'b', 'c'] });
    get().dropTask('chem');
    expect(get().tasks.some((t) => t.id === 'chem')).toBe(false);
  });
});

describe('end of day', () => {
  it('bedtime rolls open tasks over once and charges missed stakes', () => {
    fresh();
    get().setStake('physics', true);
    get().tapAnchor('wake', 462);
    get().tapAnchor('sleep', 1400);
    expect(get().xp).toBe(1240 - 50);
    expect(get().pendingStake).toMatchObject({ titles: ['Physics: Optics chapter 4'], loss: 50 });
    expect(get().tasks.find((t) => t.id === 'read')?.rolled).toBe(1);
    expect(get().tasks.find((t) => t.id === 'workout')?.rolled).toBe(0); // routines never pile up
    // The next morning does not count it a second time.
    get().ensureToday(SAT);
    expect(get().tasks.find((t) => t.id === 'read')?.rolled).toBe(1);
    expect(get().xp).toBe(1240 - 50);
  });

  it('a day that ends without a sleep tap still rolls over', () => {
    fresh();
    get().setStake('read', true);
    get().ensureToday(SAT);
    expect(get().tasks.find((t) => t.id === 'read')?.rolled).toBe(1);
    expect(get().xp).toBe(1240 - 50);
    expect(get().pendingStake?.titles).toEqual(['Read 20 pages']);
    get().dismissPendingStake();
    expect(get().pendingStake).toBeNull();
  });

  it('XP never goes below zero', () => {
    fresh();
    useApp.setState({ xp: 20 });
    get().setStake('read', true);
    get().tapAnchor('sleep', 1400);
    expect(get().xp).toBe(0);
  });

  it('finished one-off tasks disappear the next day and routines return', () => {
    fresh();
    get().startRun('workout', 5);
    get().completeActive({ photo: 'a' });
    get().startRun('read', 5);
    get().completeActive({ photo: 'b' });
    get().ensureToday(SAT);
    expect(get().tasks.some((t) => t.id === 'read')).toBe(false);
    expect(get().tasks.find((t) => t.id === 'workout')?.done).toBe(false);
  });
});

describe('rest mode', () => {
  it('pauses routines and chores, counts nothing as skipped, freezes the streak, and ends by itself', () => {
    fresh();
    get().setRest('sick', 1);
    expect(get().restUntil).toBe('2026-11-21');
    expect(get().tasks.some((t) => t.chore)).toBe(false);
    expect(planFor(480, 5, FRI).placed.some((b) => b.t.routine)).toBe(false);

    get().startRun('read', 5);
    get().completeActive({ photo: 'a' });
    expect(get().streak).toBe(6); // frozen

    get().tapAnchor('sleep', 1300);
    expect(get().tasks.find((t) => t.id === 'plan')?.rolled).toBe(0);

    get().ensureToday('2026-11-21'); // still inside the rest window
    expect(get().rest).toBe('sick');
    get().ensureToday('2026-11-22'); // past the last day
    expect(get().rest).toBe('normal');
    expect(get().tasks.some((t) => t.chore)).toBe(false); // Sunday: no chore
  });

  it('a routine already running stays on the plan when rest mode starts', () => {
    fresh();
    get().startRun('workout', 5);
    get().setRest('sick', 1);
    expect(planFor(480, 5, FRI).placed.some((b) => b.t.id === 'workout')).toBe(true);
    get().completeActive({ photo: 'a' });
    expect(planFor(480, 5, FRI).placed.some((b) => b.t.id === 'workout')).toBe(false);
  });

  it('switching back to normal brings the chore back', () => {
    fresh();
    get().setRest('travel', null);
    get().setRest('normal');
    expect(get().tasks.some((t) => t.chore)).toBe(true);
  });
});

describe('pinning', () => {
  it('a pinned task becomes a fixed block, and a bad pin is ignored', () => {
    fresh();
    get().tapAnchor('wake', 462);
    get().pinTask('read', 1250);
    const p = planFor(470, 5, FRI);
    expect(p.placed.find((b) => b.t.id === 'read')).toMatchObject({ s: 1250, pinned: true });
    get().pinTask('read', 700); // office hours: no window
    expect(planFor(470, 5, FRI).placed.find((b) => b.t.id === 'read')?.pinned).toBeUndefined();
    get().pinTask('read', null);
  });
});

describe('life admin and study', () => {
  it('chores rotate and skip weekends', () => {
    fresh();
    get().rotateChores();
    expect(get().tasks.find((t) => t.chore)?.title).toBe('Chore: Kitchen reset'); // offset 1 on Friday
  });

  it('paying a bill moves it to the next cycle and gives 15 XP', () => {
    fresh();
    const bill = get().bills.find((b) => b.id === 'b3')!; // rent, due on the 1st
    const due = upcomingDue(bill, FRI);
    expect(due).toBe('2026-12-01');
    const r = get().payBill('b3', due, 'file:///shot.jpg')!;
    expect(r.base).toBe(15);
    expect(upcomingDue(get().bills.find((b) => b.id === 'b3')!, FRI)).toBe('2027-01-01');
    expect(get().done.at(-1)).toMatchObject({ title: 'Paid: Rent', proofUri: 'file:///shot.jpg' });
  });

  it('chapters cycle to do, learning, revised', () => {
    fresh();
    get().cycleChapter('Physics', 1); // Optics 5 starts at 0
    expect(get().study.chapters.Physics[1].s).toBe(1);
    get().cycleChapter('Physics', 1);
    get().cycleChapter('Physics', 1);
    expect(get().study.chapters.Physics[1].s).toBe(0);
  });

  it('water counts per day and resets on a new day', () => {
    fresh();
    expect(get().tapWater(FRI)).toBe(1);
    expect(get().tapWater(FRI)).toBe(2);
    expect(get().tapWater(SAT)).toBe(1);
  });

  it('a workout template becomes a task with the exercises as steps', () => {
    fresh();
    const id = get().addWorkout({ name: 'Push day', mins: 40, ex: ['a', 'b'] });
    expect(get().tasks.find((t) => t.id === id)).toMatchObject({ title: 'Workout: Push day', tag: 'fit', steps: ['a', 'b'] });
  });
});

describe('activity', () => {
  it('check-in answers are logged', () => {
    fresh();
    get().logActivity('Resting 15 min');
    expect(get().activity.at(-1)?.text).toBe('Resting 15 min');
  });
});

describe('every-N-days routines', () => {
  /** Everything the plan knows about for the day: placed now or pushed to later. */
  const known = (now: number, dow: number, date: string) => {
    const p = planFor(now, dow, date);
    return [...p.placed.map((b) => b.t.id), ...p.later.map((t) => t.id)];
  };
  it('finishing one hides it until N days later, across days', () => {
    fresh();
    useApp.setState({ tasks: [...get().tasks, { id: 'utensils', title: 'Wash utensils', mins: 15, tag: 'life', must: false, prio: 2, pref: 'evening', routine: true, everyDays: 2, rolled: 0 }] });
    expect(known(480, 5, FRI)).toContain('utensils');
    get().startRun('utensils', 5);
    get().completeActive({ photo: 'a' });
    expect(get().tasks.find((t) => t.id === 'utensils')).toMatchObject({ done: true, lastDone: FRI });

    get().ensureToday(SAT); // one day later: not due yet
    expect(get().tasks.find((t) => t.id === 'utensils')?.done).toBe(false);
    expect(known(480, 6, SAT)).not.toContain('utensils');

    get().ensureToday('2026-11-22'); // two days later: due again
    expect(known(480, 0, '2026-11-22')).toContain('utensils');
  });
});

describe('move to tomorrow', () => {
  it('a weekday-only routine moved to tomorrow shows up tomorrow, once, and not the day after', () => {
    fresh(SAT);
    expect(get().tasks.find((t) => t.id === 'laundry')).toMatchObject({ routine: true, days: [6] });
    get().moveTomorrow('laundry', 'tired');
    const SUN = '2026-11-22';
    const MON = '2026-11-23';
    get().ensureToday(SUN);
    const ids = (date: string, dow: number) => {
      const p = planFor(480, dow, date);
      return [...p.placed.map((b) => b.t.id), ...p.later.map((t) => t.id)];
    };
    expect(ids(SUN, 0)).toContain('laundry');
    get().ensureToday(MON);
    expect(ids(MON, 1)).not.toContain('laundry');
  });
});
