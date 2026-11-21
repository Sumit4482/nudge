import { SUPABASE_KEY, SUPABASE_URL } from './site';

export type Tag = 'fit' | 'study' | 'life';

export interface Proof {
  id: string;
  task_title: string;
  tag: Tag;
  caption: string | null;
  minutes: number;
  xp: number;
  /** Path inside the public "wall" bucket. Empty for sample proofs. */
  image_path: string;
  created_at: string;
}

export interface SiteData {
  proofs: Proof[];
  stats: { streak: number; level: number; xp: number; week_count: number };
  daily: { day: string; n: number }[];
  cheers: number;
  /** True when Supabase is not set up and this page shows made-up examples. */
  sample: boolean;
}

async function rest<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY as string, Authorization: `Bearer ${SUPABASE_KEY}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export const imageUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/wall/${path}`;

const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

function sampleData(): SiteData {
  const rows: [string, Tag, string, number, number, number][] = [
    ['Physics: Optics chapter 4', 'study', 'Closed the book, wrote the three laws from memory.', 50, 80, 38],
    ['Morning workout', 'fit', 'Push day. Selfie lighting is bad, reps were good.', 30, 56, 430],
    ['Read 20 pages', 'study', 'Page 118 marked. Tea went cold, pages did not.', 25, 30, 560],
    ['Chemistry: revise Unit 2', 'study', 'Reaction rates summary. Finally makes sense.', 60, 72, 1500],
    ['Plan tomorrow and tidy up', 'life', 'Desk cleared, tomorrow has three must-dos.', 15, 38, 1620],
    ['Home workout', 'fit', 'No gym, plenty of floor. Plank held 60 seconds.', 30, 56, 1900],
    ['Physics: Waves', 'study', 'Solved four numericals. One needed a second try.', 50, 80, 2900],
    ['Clean the room', 'life', 'Floor, desk and the corner nobody mentions.', 60, 92, 3100],
    ['Laundry: wash, dry, fold', 'life', 'Everything folded and actually put away.', 45, 74, 4400],
    ['Maths problem set', 'study', 'Twelve of twelve. Checked the answers twice.', 60, 72, 4600],
    ['Leg day', 'fit', 'Squats felt heavy. Stretched properly after.', 45, 74, 5800],
    ['Chemistry: Unit 1 notes', 'study', 'Rewrote the notes in my own words.', 50, 80, 7300],
  ];
  const proofs = rows.map(([t, tag, c, m, xp, a], i) => ({ id: `s${i}`, task_title: t, tag, caption: c, minutes: m, xp, image_path: '', created_at: ago(a) }));
  const daily = Array.from({ length: 80 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000);
    const n = (i * 7 + (i % 3) * 2) % 7 < 2 ? 0 : 1 + ((i * 3) % 4);
    return { day: d.toISOString().slice(0, 10), n };
  });
  return { proofs, stats: { streak: 12, level: 4, xp: 1840, week_count: 14 }, daily, cheers: 128, sample: true };
}

/** Everything the page shows. Falls back to sample data when Supabase is not set up or cannot be reached. */
export async function getSiteData(): Promise<SiteData> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return sampleData();
  try {
    const [proofs, stats, daily, cheers] = await Promise.all([
      rest<Proof[]>('public_proofs?select=*&order=created_at.desc&limit=60'),
      rest<SiteData['stats'][]>('public_stats?select=*'),
      rest<SiteData['daily']>('public_daily?select=*'),
      rest<{ total: number }[]>('public_cheers?select=*'),
    ]);
    return {
      proofs,
      stats: stats[0] ?? { streak: 0, level: 1, xp: 0, week_count: 0 },
      daily,
      cheers: cheers[0]?.total ?? 0,
      sample: false,
    };
  } catch {
    return sampleData();
  }
}
