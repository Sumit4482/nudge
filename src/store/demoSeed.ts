import type { Bill } from '../life/logic';
import type { Task } from '../types';
import type { Goal, StudyState } from './seed';

/** Demo data from the prototype. Used only by the tests. */
export function demoTasks(): Task[] {
  return [
    {
      id: 'workout',
      title: 'Morning workout',
      mins: 30,
      tag: 'fit',
      must: true,
      prio: 3,
      pref: 'morning',
      days: [1, 3, 5, 6],
      routine: true,
      rolled: 0,
      steps: ['Shoes on, water filled (2 min)', 'Warm up: 5 min', 'Main set: 3 rounds', 'Stretch, then selfie proof'],
    },
    {
      id: 'physics',
      title: 'Physics: Optics chapter 4',
      mins: 50,
      tag: 'study',
      must: true,
      prio: 3,
      pref: 'evening',
      rolled: 0,
      subject: 'Physics',
      chapter: true,
      trigger: { when: 'home' },
      steps: [
        'Open notes, start the timer',
        'List the 3 laws you must know',
        'Solve 4 numericals',
        'Close the book, recall each law',
        'Write a 5-line summary',
      ],
    },
    { id: 'chem', title: 'Chemistry: revise Unit 2', mins: 60, tag: 'study', must: false, prio: 2, pref: 'evening', rolled: 2, subject: 'Chemistry' },
    { id: 'read', title: 'Read 20 pages', mins: 25, tag: 'study', must: false, prio: 2, pref: 'evening', rolled: 0, subject: 'Reading' },
    { id: 'plan', title: 'Plan tomorrow + 5-min tidy', mins: 15, tag: 'life', must: true, prio: 2, pref: 'evening', rolled: 0 },
    {
      id: 'laundry',
      title: 'Laundry: wash, dry, fold',
      mins: 45,
      tag: 'life',
      must: true,
      prio: 3,
      pref: 'morning',
      days: [6],
      routine: true,
      rolled: 0,
      steps: ['Sort and load the machine', 'Move to dryer or hang up', 'Fold everything', 'Put it all away, photo of the shelf'],
    },
    {
      id: 'clean',
      title: 'Clean the room',
      mins: 60,
      tag: 'life',
      must: true,
      prio: 2,
      pref: 'any',
      days: [6, 0],
      routine: true,
      rolled: 0,
      steps: ['Playlist on, clear every surface', 'Bin and dishes out', 'Floor: sweep and mop', 'Photo: bed, desk, floor'],
    },
    {
      id: 'review',
      title: 'Weekly review',
      mins: 15,
      tag: 'life',
      must: false,
      prio: 2,
      pref: 'evening',
      days: [0],
      routine: true,
      rolled: 0,
      steps: ['What went well', 'What slipped, and why', "Pick next week's 3 must-dos"],
    },
  ];
}

export function demoStudy(): StudyState {
  return {
    subjects: ['Physics', 'Chemistry', 'Reading'],
    chapters: {
      Physics: [
        { name: 'Optics 4', s: 1 },
        { name: 'Optics 5', s: 0 },
        { name: 'Thermodynamics', s: 0 },
        { name: 'Waves', s: 2 },
      ],
      Chemistry: [
        { name: 'Unit 1', s: 2 },
        { name: 'Unit 2', s: 1 },
        { name: 'Unit 3', s: 0 },
      ],
    },
    exams: [
      { subject: 'Physics', date: '2026-12-20' },
      { subject: 'Chemistry', date: '2026-12-27' },
    ],
    minutes: {},
  };
}

export function demoBills(): Bill[] {
  return [
    { id: 'b1', title: 'Electricity bill', dueDay: 24, repeat: 'monthly' },
    { id: 'b2', title: 'Phone recharge', dueDay: 28, repeat: 'monthly' },
    { id: 'b3', title: 'Rent', dueDay: 1, repeat: 'monthly' },
    { id: 'b4', title: 'Insurance premium', dueDay: 15, repeat: 'yearly', month: 12 },
  ];
}

export function demoGoals(): Goal[] {
  return [
    { id: 'g1', title: 'Get fit this month', sub: '12 workouts. Each one counts toward this.', kind: 'tag', tag: 'fit', target: 12, base: 5 },
    { id: 'g2', title: 'Finish the Physics syllabus', sub: 'Every chapter revised before Dec 20.', kind: 'chapters', subject: 'Physics', target: 4, base: 0 },
  ];
}
