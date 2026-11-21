import { router } from 'expo-router';
import { toast } from '../lib/toast';
import { clearFocus, ensurePermission, presentPinned, scheduleNags, setupNotifications } from '../notifications/focus';
import { needsSplitOrDrop } from '../planner/rollover';
import type { RewardSummary } from '../rewards';
import { useApp, type ActiveRun } from '../store/useApp';

/** Text for the pinned notification body. */
export function pinnedBody(run: ActiveRun, steps?: string[]): string {
  if (steps?.length) return `Step ${run.step + 1}/${steps.length}: ${steps[run.step]}`;
  return 'In focus. Stay on it. Add proof when you finish.';
}

async function refreshNotification(): Promise<void> {
  const s = useApp.getState();
  const run = s.active;
  if (!run) return;
  const t = s.tasks.find((x) => x.id === run.taskId);
  try {
    await presentPinned({ taskId: run.taskId, title: run.title, body: pinnedBody(run, t?.steps) });
    await scheduleNags({ taskId: run.taskId, title: run.title, endAt: run.startAt + run.runMins * 60000 });
  } catch (e) {
    // The timer and proof flow still work without the notification.
    console.warn('Could not show the pinned notification', e);
    toast('Could not show the pinned notification on this device.');
  }
}

/**
 * Open the focus sheet for a task. Only one task can be active at a time.
 * A task skipped twice asks "Why am I avoiding this?" first. Skipped 3 times, it must be split or dropped.
 */
export function openTask(id: string): void {
  const s = useApp.getState();
  const task = s.tasks.find((t) => t.id === id);
  if (!task) return;
  if (s.active && s.active.taskId !== id) {
    toast(`Finish "${s.active.title}" first. Add proof to unlock the next one.`);
    return;
  }
  if (!s.active && (needsSplitOrDrop(task) || (task.rolled >= 2 && !task.whyAsked))) {
    router.push({ pathname: '/why', params: { id } });
    return;
  }
  router.push({ pathname: '/focus', params: { id } });
}

/** Start a run: pins the notification and schedules reminders for when time is up. */
export async function startFocus(taskId: string, runMins: number, pomodoro = false): Promise<void> {
  const run = useApp.getState().startRun(taskId, runMins, pomodoro);
  if (!run) return;
  await setupNotifications();
  const ok = await ensurePermission();
  if (!ok) {
    toast('Notifications are off. Turn them on in Android settings so the pin can work.');
    return;
  }
  await refreshNotification();
}

export async function advanceStep(): Promise<void> {
  useApp.getState().nextStep();
  await refreshNotification();
}

export async function extendFocus(mins: number): Promise<void> {
  useApp.getState().extendRun(mins);
  await refreshNotification();
}

/** Save the proof, finish the task and clear the pinned notification. */
export async function finishWithProof(proof: { photo?: string; audio?: string }, shared = false): Promise<RewardSummary | null> {
  const res = useApp.getState().completeActive(proof, shared);
  await clearFocus().catch(() => undefined);
  return res;
}

/** Put the pinned notification back, for example when the app returns to the foreground. */
export async function repostIfActive(): Promise<void> {
  if (useApp.getState().active) await refreshNotification();
}
