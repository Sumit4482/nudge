import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { usePlan } from '@/hooks/usePlan';
import { upcomingDue } from '@/life/logic';
import { cancelNudges, scheduleBills, scheduleCheckin, scheduleDailies } from '@/notifications/nudges';
import { MY_TIMES } from '@/lib/times';
import { nextFreeBlock } from '@/planner/checkin';
import { useApp } from '@/store/useApp';
import { syncStats } from '@/wall/api';
import { processWallQueue } from '@/wall/queue';
import { registerPush } from '@/wall/cheers';
import { wallConfigured } from '@/wall/supabase';
import { useWallSession } from '@/wall/useSession';

/**
 * Background work that follows the plan: schedules check-ins and daily reminders, and shows missed stakes. Renders nothing.
 */
export function AppServices() {
  const plan = usePlan();
  const { date } = plan;
  const bills = useApp((s) => s.bills);
  const rest = useApp((s) => s.rest);
  const active = useApp((s) => !!s.active);
  const pendingStake = useApp((s) => s.pendingStake);
  const queued = useApp((s) => s.wallQueue.length);
  const streak = useApp((s) => s.streak);
  const xp = useApp((s) => s.xp);
  const done = useApp((s) => s.done);
  // "You're free. Doing what?" at the start of the next free block. Quiet in sick mode and during a run.
  const next = useMemo(() => nextFreeBlock(plan.blocks, plan.now), [plan.blocks, plan.now]);
  const nextS = next?.s;
  const nextE = next?.e;
  useEffect(() => {
    if (active || rest === 'sick' || nextS == null || nextE == null) {
      scheduleCheckin(null).catch(() => undefined);
      return;
    }
    const at = new Date();
    at.setHours(0, 0, 0, 0);
    at.setMinutes(nextS);
    scheduleCheckin({ at, s: nextS, e: nextE }).catch(() => undefined);
  }, [active, rest, nextS, nextE]);

  // Daily wind-down and water reminders, and bill reminders. Silent in sick mode.
  const windDown = MY_TIMES.sleep - 30;
  useEffect(() => {
    if (rest === 'sick') {
      cancelNudges().catch(() => undefined);
      return;
    }
    scheduleDailies({ hour: Math.floor(windDown / 60), minute: windDown % 60 }, { hour: Math.floor(MY_TIMES.wake / 60), minute: MY_TIMES.wake % 60 }).catch(() => undefined);
    scheduleBills(
      bills.map((b) => ({ id: b.id, title: b.title, due: upcomingDue(b, date) })),
      date,
    ).catch(() => undefined);
  }, [rest, bills, date, windDown]);

  // Proof wall: upload shared photos when there is a connection, and share your totals.
  useEffect(() => {
    if (!wallConfigured) return;
    processWallQueue();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') processWallQueue();
    });
    return () => sub.remove();
  }, [queued]);
  useEffect(() => {
    if (!wallConfigured) return;
    syncStats({ streak, xp, done, today: date }).catch(() => undefined);
  }, [streak, xp, done, date]);

  // Cheers: let this phone receive a push when someone cheers. Quietly skipped in Expo Go.
  const { userId } = useWallSession();
  useEffect(() => {
    if (userId) registerPush().catch(() => undefined);
  }, [userId]);

  // A missed stake waits for you: show it once.
  useEffect(() => {
    if (pendingStake) router.push('/stake');
  }, [pendingStake]);

  return null;
}
