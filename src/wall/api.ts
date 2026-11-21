import { File } from 'expo-file-system';
import { level } from '../rewards';
import type { DoneItem, WallItem } from '../store/useApp';
import { addDays } from '../lib/dates';
import { supabase } from './supabase';

export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/** Sign in with the email and password you created in the Supabase dashboard. New sign-ups are turned off there, so only you can post. */
export async function signIn(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'The proof wall is not set up yet.';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}

/**
 * Shrink the photo to 1080 px and re-save it as JPEG. Re-saving drops GPS and camera details.
 * Falls back to the original if the image module is not in this build.
 */
async function prepare(uri: string): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IM = require('expo-image-manipulator') as typeof import('expo-image-manipulator');
    const ctx = IM.ImageManipulator.manipulate(uri).resize({ width: 1080 });
    const img = await ctx.renderAsync();
    const out = await img.saveAsync({ format: IM.SaveFormat.JPEG, compress: 0.8 });
    return out.uri;
  } catch {
    return uri;
  }
}

/** Upload one queued proof: photo to the public wall bucket, then a row the website can read. */
export async function uploadProof(item: WallItem): Promise<void> {
  if (!supabase) throw new Error('not configured');
  const uid = await currentUserId();
  if (!uid) throw new Error('not signed in');
  const path = `${uid}/${item.id}.jpg`;
  const prepared = await prepare(item.photoUri);
  const bytes = await new File(prepared).arrayBuffer();
  const up = await supabase.storage.from('wall').upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (up.error) throw up.error;
  const ins = await supabase.from('proofs').upsert(
    {
      user_id: uid,
      task_title: item.title,
      tag: item.tag,
      minutes: item.mins,
      xp: item.xp,
      image_path: path,
      is_public: true,
      publish_at: item.publishAt,
    },
    { onConflict: 'image_path' },
  );
  if (ins.error) throw ins.error;
}

/** Take a proof off the wall: delete its row and its photo. */
export async function removeFromWall(doneId: string): Promise<void> {
  if (!supabase) return;
  const uid = await currentUserId();
  if (!uid) return;
  const path = `${uid}/${doneId}.jpg`;
  await supabase.from('proofs').delete().eq('image_path', path);
  await supabase.storage.from('wall').remove([path]);
}

/** Share only aggregates: streak, level, XP and how many proofs per day. No titles, times of day or places. */
export async function syncStats(input: { streak: number; xp: number; done: DoneItem[]; today: string }): Promise<void> {
  if (!supabase) return;
  const uid = await currentUserId();
  if (!uid) return;
  const counts: Record<string, number> = {};
  for (const d of input.done) counts[d.date] = (counts[d.date] ?? 0) + 1;
  const week = Array.from({ length: 7 }, (_, i) => addDays(input.today, -i)).reduce((n, d) => n + (counts[d] ?? 0), 0);
  await supabase.from('profiles').upsert({ user_id: uid, streak: input.streak, level: level(input.xp), xp: input.xp, week_count: week, updated_at: new Date().toISOString() });
  const rows = Object.entries(counts).map(([day, n]) => ({ user_id: uid, day, n }));
  if (rows.length) await supabase.from('daily_counts').upsert(rows, { onConflict: 'user_id,day' });
}
