import { useApp } from '../store/useApp';
import { uploadProof, currentUserId } from './api';
import { wallConfigured } from './supabase';

let running = false;

/** Upload waiting proofs one by one. Stops at the first failure and tries again next time. Returns how many went up. */
export async function processWallQueue(): Promise<number> {
  if (running || !wallConfigured) return 0;
  running = true;
  let sent = 0;
  try {
    if (!(await currentUserId())) {
      useApp.getState().setWallNote('Upload skipped: not signed in to the wall.');
      return 0;
    }
    for (const item of [...useApp.getState().wallQueue]) {
      try {
        await uploadProof(item);
        useApp.getState().dequeueWall(item.id);
        sent += 1;
      } catch (e) {
        console.warn('Wall upload failed, will retry', e);
        const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e);
        useApp.getState().setWallNote(`Upload failed: ${msg}`);
        break;
      }
    }
  } finally {
    running = false;
  }
  if (sent) useApp.getState().setWallNote(`Uploaded ${sent} proof${sent === 1 ? '' : 's'}.`);
  return sent;
}
