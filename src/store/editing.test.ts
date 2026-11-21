import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined },
}));

import { demoBills, demoGoals, demoStudy, demoTasks } from './demoSeed';
import { useApp } from './useApp';

const get = () => useApp.getState();

beforeEach(() => {
  useApp.setState({ ...useApp.getInitialState(), tasks: demoTasks(), study: demoStudy(), bills: demoBills(), goals: demoGoals() }, true);
  get().ensureToday('2026-11-20');
});

describe('editing tasks and routines', () => {
  it('changes the fields and cleans up the steps', () => {
    expect(get().updateTask('workout', { title: '  Run  ', mins: 45, steps: [' warm up ', '', 'go  '], tag: 'fit', pref: 'evening' })).toBe(true);
    expect(get().tasks.find((t) => t.id === 'workout')).toMatchObject({ title: 'Run', mins: 45, steps: ['warm up', 'go'], pref: 'evening' });
  });

  it('refuses an empty title and an unknown id', () => {
    expect(get().updateTask('workout', { title: '   ' })).toBe(false);
    expect(get().tasks.find((t) => t.id === 'workout')?.title).toBe('Morning workout');
    expect(get().updateTask('nope', { mins: 10 })).toBe(false);
  });

  it('keeps minutes in range and must-do sets priority', () => {
    get().updateTask('read', { mins: 9999 });
    expect(get().tasks.find((t) => t.id === 'read')?.mins).toBe(480);
    get().updateTask('read', { mins: 0 });
    expect(get().tasks.find((t) => t.id === 'read')?.mins).toBe(1);
    get().updateTask('read', { must: true });
    expect(get().tasks.find((t) => t.id === 'read')).toMatchObject({ must: true, prio: 3 });
    get().updateTask('read', { must: false });
    expect(get().tasks.find((t) => t.id === 'read')).toMatchObject({ must: false, prio: 2 });
  });

  it('chosen days and every-N-days replace each other', () => {
    get().updateTask('workout', { everyDays: 3 });
    expect(get().tasks.find((t) => t.id === 'workout')).toMatchObject({ everyDays: 3 });
    expect(get().tasks.find((t) => t.id === 'workout')?.days).toBeUndefined();
    get().updateTask('workout', { days: [5, 1, 1] });
    expect(get().tasks.find((t) => t.id === 'workout')).toMatchObject({ days: [1, 5] });
    expect(get().tasks.find((t) => t.id === 'workout')?.everyDays).toBeUndefined();
    get().updateTask('workout', { days: [] }); // every day
    expect(get().tasks.find((t) => t.id === 'workout')?.days).toBeUndefined();
  });

  it('adds a routine that repeats on chosen days or every N days', () => {
    const a = get().addRoutine({ title: 'Evening walk', mins: 20, tag: 'fit', must: false, pref: 'evening', days: [1, 3], steps: ['Shoes on'] });
    const b = get().addRoutine({ title: 'Water plants', mins: 5, tag: 'life', must: false, pref: 'morning', everyDays: 3 });
    expect(get().tasks.find((t) => t.id === a)).toMatchObject({ routine: true, days: [1, 3], steps: ['Shoes on'] });
    expect(get().tasks.find((t) => t.id === b)).toMatchObject({ routine: true, everyDays: 3 });
    expect(get().addRoutine({ title: '  ', mins: 5, tag: 'life', must: false, pref: 'any' })).toBeNull();
  });

  it('deletes a task', () => {
    get().dropTask('read');
    expect(get().tasks.some((t) => t.id === 'read')).toBe(false);
  });
});

describe('editing study', () => {
  it('adds and removes subjects and topics, with no duplicates', () => {
    expect(get().addSubject('Databases')).toBe(true);
    expect(get().addSubject('databases')).toBe(false);
    expect(get().addTopic('Databases', 'Indexes')).toBe(true);
    expect(get().addTopic('Databases', 'indexes')).toBe(false);
    expect(get().addTopic('Nope', 'x')).toBe(false);
    expect(get().study.chapters.Databases).toEqual([{ name: 'Indexes', s: 0 }]);
    get().removeTopic('Databases', 0);
    expect(get().study.chapters.Databases).toEqual([]);
    get().removeSubject('Databases');
    expect(get().study.subjects).not.toContain('Databases');
    expect(get().study.chapters.Databases).toBeUndefined();
  });

  it('sets, replaces and clears an exam date, and deleting a subject drops its date', () => {
    get().setExam('Physics', '2027-01-10');
    expect(get().study.exams.find((e) => e.subject === 'Physics')?.date).toBe('2027-01-10');
    get().setExam('Physics', null);
    expect(get().study.exams.some((e) => e.subject === 'Physics')).toBe(false);
    get().setExam('Chemistry', '2027-02-01');
    get().removeSubject('Chemistry');
    expect(get().study.exams.some((e) => e.subject === 'Chemistry')).toBe(false);
  });
});

describe('editing goals and bills', () => {
  it('adds, edits and removes a goal', () => {
    const id = get().saveGoal({ title: ' Read ', sub: '', kind: 'tag', tag: 'study', target: 12.4, base: 0 });
    expect(get().goals.find((g) => g.id === id)).toMatchObject({ title: 'Read', target: 12 });
    get().saveGoal({ id, title: 'Read more', sub: '', kind: 'tag', tag: 'study', target: 0, base: 0 });
    expect(get().goals.find((g) => g.id === id)).toMatchObject({ title: 'Read more', target: 1 });
    expect(get().goals.filter((g) => g.id === id)).toHaveLength(1);
    get().removeGoal(id);
    expect(get().goals.some((g) => g.id === id)).toBe(false);
  });

  it('adds, edits and removes a bill, keeping the due day in range', () => {
    const id = get().saveBill({ title: 'Gym', dueDay: 45, repeat: 'monthly' });
    expect(get().bills.find((b) => b.id === id)).toMatchObject({ title: 'Gym', dueDay: 31 });
    get().saveBill({ id, title: 'Gym', dueDay: 0, repeat: 'yearly', month: 6 });
    expect(get().bills.find((b) => b.id === id)).toMatchObject({ dueDay: 1, repeat: 'yearly', month: 6 });
    get().removeBill(id);
    expect(get().bills.some((b) => b.id === id)).toBe(false);
  });
});
