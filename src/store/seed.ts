import type { Bill } from '../life/logic';
import type { ChapterStatus } from '../study/logic';
import type { Task } from '../types';

/**
 * Your starting plan. Everything here is data: change a line and it changes in the app on a fresh start.
 * Days: 0 = Sunday .. 6 = Saturday. Steps follow the rule: the first step takes 2 minutes or less.
 *
 * Weekly shape (wake 06:30, sleep 22:30):
 *   Mon strength A + DSA      Tue run-walk + system design   Wed strength B + DSA
 *   Thu mobility + backend    Fri strength C + AI            Sat pool + deep build + laundry
 *   Sun easy run-walk, weigh-in, meal prep, weekly review, reading
 * Every day: morning reset (water, back mobility, bed, room, garbage) and breakfast with protein.
 */

const MON = 1;
const TUE = 2;
const WED = 3;
const THU = 4;
const FRI = 5;
const SAT = 6;
const SUN = 0;

type Seed = Omit<Task, 'rolled'>;
const t = (x: Seed): Task => ({ ...x, rolled: 0, routine: true });

export function seedTasks(): Task[] {
  return [
    // ---------- Every morning ----------
    t({
      id: 'reset',
      title: 'Morning reset',
      mins: 21,
      tag: 'life',
      must: true,
      prio: 3,
      pref: 'morning',
      trigger: { when: 'wake' },
      steps: [
        'Drink a full glass of water (1 min)',
        'Back mobility: cat-cow 10, child pose 45 s, hip flexor stretch 45 s each side, cobra 30 s (5 min)',
        'Make the bed, tight corners (3 min)',
        'Clean the room: clothes away, desk clear, floor swept (10 min)',
        'Take the garbage out (2 min)',
      ],
    }),
    t({
      id: 'breakfast',
      title: 'Breakfast with protein',
      mins: 15,
      tag: 'life',
      must: false,
      prio: 2,
      pref: 'morning',
      steps: ['Start cooking or grab it (2 min)', '3 eggs or paneer or dal, plus roti, oats or rice', 'A glass of milk or a banana shake, then wash up'],
    }),
    t({
      id: 'hall',
      title: 'Clean hall and balcony',
      mins: 15,
      tag: 'life',
      must: false,
      prio: 2,
      pref: 'morning',
      everyDays: 2,
      steps: ['Open the balcony door, bring a bag and cloth (2 min)', 'Sweep the hall and balcony', 'Wipe surfaces and the balcony rail', 'Bin the dust, put things back'],
    }),

    // ---------- Training (no gym, no equipment: bodyweight) ----------
    t({
      id: 'strengthA',
      title: 'Strength A: push and legs',
      mins: 30,
      tag: 'fit',
      must: true,
      prio: 3,
      pref: 'morning',
      days: [MON],
      steps: [
        'Clear a space, water ready (2 min)',
        'Warm-up 4 min: arm circles 20, hip circles 10 each way, bodyweight squats 10, cat-cow 10',
        'Circuit, 3 rounds, rest 60 s between rounds: push-ups 8 to 12 (knees or table if needed), squats 15, glute bridges 15, plank 30 s',
        'Finisher: pike push-ups 6 to 8, wall sit 45 s, calf raises 20',
        'Stretch 3 min, selfie proof. Eat protein within an hour. Add 1 or 2 reps each week.',
      ],
    }),
    t({
      id: 'strengthB',
      title: 'Strength B: pull and core',
      mins: 30,
      tag: 'fit',
      must: true,
      prio: 3,
      pref: 'morning',
      days: [WED],
      steps: [
        'Clear a space, water ready (2 min)',
        'Warm-up 4 min: shoulder rolls, hip hinges 10, cat-cow 10, bodyweight squats 10',
        'Circuit, 3 rounds, rest 60 s: table rows 8 to 10 (lie under a sturdy table, pull up), reverse lunges 10 each leg, superman holds 12, dead bug 10 each side',
        'Finisher: side plank 20 s each side, glute bridge hold 30 s, calf raises 20',
        'Stretch 3 min, selfie proof. Eat protein within an hour.',
      ],
    }),
    t({
      id: 'strengthC',
      title: 'Strength C: full body',
      mins: 30,
      tag: 'fit',
      must: true,
      prio: 3,
      pref: 'morning',
      days: [FRI],
      steps: [
        'Clear a space, water ready (2 min)',
        'Warm-up 4 min: jumping jacks 30, arm circles, hip circles, bodyweight squats 10',
        'Circuit, 3 rounds, rest 60 s: squat to reach 15, push-ups 8 to 12, chair split squats 8 each leg, single-leg glute bridge 10 each leg',
        'Finisher: mountain climbers 30 s, bear crawl 30 s, plank 40 s',
        'Stretch 3 min, selfie proof. Eat protein within an hour.',
      ],
    }),
    t({
      id: 'runwalk',
      title: 'Run-walk',
      mins: 25,
      tag: 'fit',
      must: true,
      prio: 3,
      pref: 'morning',
      days: [TUE, SUN],
      steps: [
        'Shoes on, water, step outside (2 min)',
        'Walk 5 min to warm up',
        'Weeks 1 to 2: run 3 min, walk 1 min, repeat 5 times. Weeks 3 to 4: run 5 min, walk 1 min, 3 times. Weeks 5 to 6: run 8 min, walk 1 min, 2 times. Weeks 7 to 8: run 20 min, then 5 km non-stop.',
        'Walk 3 min to cool down, stretch calves and hips, selfie proof',
      ],
    }),
    t({
      id: 'mobcore',
      title: 'Mobility and core',
      mins: 20,
      tag: 'fit',
      must: true,
      prio: 2,
      pref: 'morning',
      days: [THU],
      steps: [
        'Mat or towel down (1 min)',
        'Cat-cow 10, child pose 45 s, hip flexor stretch 45 s each side',
        'Core, 2 rounds: bird-dog 8 each side, dead bug 8 each side, plank 30 s, side plank 20 s each side',
        'Glute bridges 12, supine twist 30 s each side, selfie proof',
      ],
    }),
    t({
      id: 'pool',
      title: 'Pool: swim (with travel)',
      mins: 120,
      tag: 'fit',
      must: true,
      prio: 3,
      pref: 'morning',
      days: [SAT],
      steps: [
        'Pack the bag: swimsuit, towel, goggles, cap, water, change of clothes (2 min)',
        'Travel to the pool (about 3 km)',
        'Warm-up 10 min: float, bubble breathing, kick with the board',
        'Main set: 8 x 25 m any stroke with 30 s rest, then 4 x 25 m kick with the board',
        'Cool down 3 min easy, note the distance, selfie proof. Book 3 to 4 lessons for technique.',
      ],
    }),
    t({
      id: 'weigh',
      title: 'Weigh-in',
      mins: 3,
      tag: 'life',
      must: false,
      prio: 2,
      pref: 'morning',
      days: [SUN],
      steps: ['After the toilet, before eating: stand on the scale (1 min)', 'Note the number. Aim for about 0.25 to 0.4 kg a week. Target 56 to 58 kg.'],
    }),

    // ---------- Weekday evenings ----------
    t({
      id: 'dsa',
      title: 'DSA in C++',
      mins: 90,
      tag: 'study',
      must: true,
      prio: 3,
      pref: 'evening',
      days: [MON, WED],
      subject: 'DSA',
      steps: [
        'Open the notes and start the timer (2 min)',
        'Revise yesterday: re-solve one old problem from memory (15 min)',
        "Learn today's pattern: the idea, a template, 2 examples (20 min)",
        'Solve 2 new problems in C++ without hints (40 min)',
        'Write the solution notes and log the mistakes (10 min)',
      ],
    }),
    t({
      id: 'sysdesign',
      title: 'System design',
      mins: 75,
      tag: 'study',
      must: true,
      prio: 3,
      pref: 'evening',
      days: [TUE],
      subject: 'System design',
      steps: [
        'Open the topic and start the timer (2 min)',
        'Read or watch one lesson on the topic (30 min)',
        'Sketch a design on paper: requirements, numbers, boxes, data flow (25 min)',
        'Find 3 trade-offs and write them in 5 lines (10 min)',
        'Say the design out loud for 3 minutes',
      ],
    }),
    t({
      id: 'backend',
      title: 'Backend: Node and TypeScript',
      mins: 75,
      tag: 'study',
      must: true,
      prio: 3,
      pref: 'evening',
      days: [THU],
      subject: 'Backend',
      steps: [
        'Open the editor and the repo (2 min)',
        'Read the topic and take notes (20 min)',
        'Build it in your practice API, small and working (40 min)',
        'Test it, then commit with a clear message (10 min)',
      ],
    }),
    t({
      id: 'ai',
      title: 'AI',
      mins: 60,
      tag: 'study',
      must: true,
      prio: 3,
      pref: 'evening',
      days: [FRI],
      subject: 'AI',
      steps: [
        'Open the notebook and start the timer (2 min)',
        'Read or watch one lesson (20 min)',
        'Code the example yourself, no copy-paste (30 min)',
        'Write 3 lines: what it does and where it fails',
      ],
    }),
    t({
      id: 'lunch',
      title: 'Pack lunch and a protein snack',
      mins: 5,
      tag: 'life',
      must: false,
      prio: 2,
      pref: 'evening',
      days: [SUN, MON, TUE, WED, THU],
      steps: ['Pack lunch for tomorrow (3 min)', 'Add a protein snack: boiled eggs, peanuts, paneer or curd'],
    }),
    t({
      id: 'utensils',
      title: 'Wash utensils (with your roommate)',
      mins: 15,
      tag: 'life',
      must: false,
      prio: 2,
      pref: 'evening',
      everyDays: 2,
      steps: ['Tell your roommate, start together (1 min)', 'Wash, rinse, rack', 'Wipe the counter and sink'],
    }),
    t({
      id: 'plan',
      title: 'Plan tomorrow',
      mins: 10,
      tag: 'life',
      must: false,
      prio: 2,
      pref: 'evening',
      steps: ["Open tomorrow's plan (1 min)", 'Pick the one thing that matters most', 'Lay out workout clothes and charge the phone'],
    }),

    // ---------- Weekend ----------
    t({
      id: 'deepbuild',
      title: 'Deep build block',
      mins: 150,
      tag: 'study',
      must: true,
      prio: 3,
      pref: 'any',
      days: [SAT],
      subject: 'Backend',
      steps: [
        "Choose this week's project step and write the goal in one line (2 min)",
        'Build for 50 minutes, phone away',
        'Break 10 minutes. Build another 50 minutes',
        'Test, fix the worst bug, commit and push',
        'Write what you shipped and what is next (5 lines)',
      ],
    }),
    t({
      id: 'laundry',
      title: 'Wash clothes',
      mins: 45,
      tag: 'life',
      must: false,
      prio: 2,
      pref: 'any',
      everyDays: 4,
      steps: ['Collect and sort the clothes (2 min)', 'Load the machine, start it', 'Hang or dry everything', 'Fold, put away, photo of the shelf'],
    }),
    t({
      id: 'mealprep',
      title: 'Meal prep and groceries',
      mins: 75,
      tag: 'life',
      must: false,
      prio: 2,
      pref: 'any',
      days: [SUN],
      steps: ['Write the list from what is missing (5 min)', 'Shop: eggs, milk, paneer, dal, rice, oats, peanuts, fruit', 'Cook a big batch of dal or rice and boil eggs', 'Box it for 3 days, photo of the fridge shelf'],
    }),
    t({
      id: 'review',
      title: 'Weekly review',
      mins: 20,
      tag: 'life',
      must: false,
      prio: 2,
      pref: 'evening',
      days: [SUN],
      steps: ['What went well this week (3 min)', 'What slipped, and why', "Pick next week's 3 must-dos", 'Check the weigh-in trend and the goals'],
    }),
    t({
      id: 'essay',
      title: 'Read one engineering or startup essay',
      mins: 30,
      tag: 'study',
      must: true,
      prio: 2,
      pref: 'evening',
      days: [SUN],
      subject: 'System design',
      steps: ['Open one article or essay (2 min)', 'Read it fully, no tabs', 'Write 3 takeaways and one thing you will try'],
    }),
  ];
}

export interface Chapter {
  name: string;
  s: ChapterStatus;
}

export interface Exam {
  subject: string;
  /** YYYY-MM-DD */
  date: string;
}

export interface StudyState {
  subjects: string[];
  chapters: Record<string, Chapter[]>;
  exams: Exam[];
  /** Focus minutes: subject, then date. */
  minutes: Record<string, Record<string, number>>;
}

const todo = (names: string[]): Chapter[] => names.map((name) => ({ name, s: 0 }));

export function seedStudy(): StudyState {
  return {
    subjects: ['DSA', 'System design', 'Backend', 'AI'],
    chapters: {
      DSA: todo([
        'C++ and STL fluency',
        'Arrays and hashing',
        'Two pointers',
        'Sliding window',
        'Stack and monotonic stack',
        'Binary search',
        'Linked list',
        'Trees: DFS and BFS',
        'Binary search trees',
        'Tries',
        'Heap and priority queue',
        'Backtracking',
        'Graphs: BFS and DFS',
        'Union-Find',
        'Topological sort and shortest paths',
        '1-D dynamic programming',
        '2-D dynamic programming',
        'Greedy',
        'Intervals',
        'Bits and math',
      ]),
      'System design': todo([
        'Requirements and estimation',
        'Scaling basics',
        'Load balancing',
        'Caching',
        'SQL vs NoSQL',
        'Replication and sharding',
        'Consistency and CAP',
        'Queues and streams',
        'API design and rate limiting',
        'Storage and CDN',
        'Search and indexing',
        'Observability and reliability',
        'Design: URL shortener',
        'Design: news feed',
        'Design: chat app',
        'Design: video streaming',
      ]),
      Backend: todo([
        'HTTP and REST',
        'TypeScript for backend',
        'Node event loop and async',
        'SQL and Postgres',
        'Indexes and query tuning',
        'ORMs and migrations',
        'Auth: sessions, JWT, OAuth',
        'Caching with Redis',
        'Queues and workers',
        'Concurrency and idempotency',
        'Testing: unit and integration',
        'Docker',
        'CI/CD and deployment',
        'Logging and monitoring',
        'Security basics',
        'Performance and profiling',
      ]),
      AI: todo([
        'Python for ML',
        'Math for ML: linear algebra and probability',
        'ML basics: regression and trees',
        'Evaluation and overfitting',
        'Neural networks basics',
        'Transformers and attention',
        'LLM APIs and prompting',
        'Embeddings and vector search',
        'RAG pipelines',
        'Tool use and agents',
        'Evaluating LLM apps',
        'Fine-tuning basics',
        'Serving and cost',
        'Project 1: a useful LLM app',
        'Project 2: your own idea',
        'Safety and guardrails',
      ]),
    },
    exams: [],
    minutes: {},
  };
}

/** No bills for now. Your EMIs are on autopay. */
export function seedBills(): Bill[] {
  return [];
}

export interface Goal {
  id: string;
  title: string;
  sub: string;
  kind: 'tag' | 'chapters';
  tag?: 'fit' | 'study' | 'life';
  subject?: string;
  target: number;
  /** Progress you had before using the app this month. */
  base: number;
}

export function seedGoals(): Goal[] {
  return [
    { id: 'g1', title: 'Train 22 sessions', sub: 'Strength, run-walk, swim and mobility. Each one counts.', kind: 'tag', tag: 'fit', target: 22, base: 0 },
    { id: 'g2', title: 'Study 20 times', sub: 'DSA, system design, backend and AI sessions.', kind: 'tag', tag: 'study', target: 20, base: 0 },
    { id: 'g3', title: 'Run the home and habits', sub: 'Morning reset, meals, hall, utensils, laundry and plans.', kind: 'tag', tag: 'life', target: 120, base: 0 },
    { id: 'g4', title: 'Learn 4 DSA topics', sub: 'Mark a topic revised once you can solve it cold.', kind: 'chapters', subject: 'DSA', target: 4, base: 0 },
  ];
}
