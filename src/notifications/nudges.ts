import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays } from '../lib/dates';
import { channelProps } from './focus';

/** What a tapped notification should do. */
export type NudgeKind = 'checkin' | 'trigger' | 'winddown' | 'water' | 'bill';

const CHECKIN_ID = 'nudge-checkin';
const DAILY_PREFIX = 'nudge-daily-';
const BILL_PREFIX = 'nudge-bill-';

/** True if notifications are allowed. Never asks. */
export async function canNotify(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

async function cancelPrefix(prefix: string): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all.filter((n) => n.identifier.startsWith(prefix)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => undefined)),
  );
}

/** Show a notification right now, for example "You said: when I'm home, start Physics". */
export async function showNow(input: { title: string; body: string; data: { kind: NudgeKind } & Record<string, unknown> }): Promise<void> {
  if (!(await canNotify())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: input.title, body: input.body, data: input.data },
    trigger: Platform.OS === 'android' && channelProps().channelId ? { channelId: channelProps().channelId! } : null,
  });
}

/** One "You're free. Doing what?" notification at the start of the next free block. Pass null to cancel. */
export async function scheduleCheckin(next: { at: Date; s: number; e: number } | null): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(CHECKIN_ID).catch(() => undefined);
  if (!next || !(await canNotify())) return;
  await Notifications.scheduleNotificationAsync({
    identifier: CHECKIN_ID,
    content: { title: "You're free. Doing what?", body: 'Tap to pick: next task, rest, scrolling, or something else.', data: { kind: 'checkin' satisfies NudgeKind, s: next.s, e: next.e } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: next.at, ...channelProps() },
  });
}

/** Daily reminders: a morning start, wind-down before bed, and water. Replaces any earlier ones. */
export async function scheduleDailies(windDown: { hour: number; minute: number }, wake?: { hour: number; minute: number }): Promise<void> {
  await cancelPrefix(DAILY_PREFIX);
  if (!(await canNotify())) return;
  const daily = (id: string, hour: number, minute: number, title: string, body: string, kind: NudgeKind) =>
    Notifications.scheduleNotificationAsync({
      identifier: `${DAILY_PREFIX}${id}`,
      content: { title, body, data: { kind } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, ...channelProps() },
    });
  if (wake) await daily('wake', wake.hour, wake.minute, 'Good morning', 'Water first. Then tap I woke up and your morning starts.', 'water');
  await daily('wind', windDown.hour, windDown.minute, 'Wind-down time', 'Screens off in 30 minutes. A quick look at tomorrow, then rest.', 'winddown');
  for (const h of [11, 15, 19]) await daily(`water-${h}`, h, 0, 'Water break', 'A glass of water. Tap the card on Today.', 'water');
}

/** Bill reminders 3 days before and on the due day, at 09:00. Replaces earlier ones. */
export async function scheduleBills(bills: { id: string; title: string; due: string }[], today: string): Promise<void> {
  await cancelPrefix(BILL_PREFIX);
  if (!(await canNotify())) return;
  for (const b of bills) {
    for (const [i, d] of [addDays(b.due, -3), b.due].entries()) {
      const [y, m, day] = d.split('-').map(Number);
      const at = new Date(y, m - 1, day, 9, 0, 0);
      if (d < today || at.getTime() < Date.now() + 5000) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: `${BILL_PREFIX}${b.id}-${i}`,
        content: { title: i === 0 ? `${b.title} due in 3 days` : `${b.title} is due today`, body: 'Pay it, then mark it paid with a screenshot.', data: { kind: 'bill' satisfies NudgeKind, billId: b.id } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, ...channelProps() },
      });
    }
  }
}

/** Silence daily reminders and the next check-in (used in sick mode). */
export async function cancelNudges(): Promise<void> {
  await cancelPrefix(DAILY_PREFIX);
  await cancelPrefix(BILL_PREFIX);
  await Notifications.cancelScheduledNotificationAsync(CHECKIN_ID).catch(() => undefined);
}
