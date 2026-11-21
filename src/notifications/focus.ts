import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

export const FOCUS_CHANNEL = 'focus';
export const FOCUS_CATEGORY = 'focus';
export const ACTION_PROOF = 'proof';
const PINNED_ID = 'focus-pinned';
const NAG_PREFIX = 'focus-nag-';
/** One reminder every 3 minutes, for an hour after the run ends. */
const NAG_COUNT = 20;
const NAG_EVERY_MS = 3 * 60 * 1000;

let ready = false;
/** True once the Focus channel exists. If channel setup fails (Expo Go can do this) we use the default channel. */
let channelOk = false;

/** Handler, channel and the Add proof action. Safe to call more than once. */
export async function setupNotifications(): Promise<void> {
  if (ready || Platform.OS === 'web') return;
  ready = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      // The channel must exist before Android 13 shows the permission prompt.
      await Notifications.setNotificationChannelAsync(FOCUS_CHANNEL, {
        name: 'Focus',
        description: 'The notification that stays pinned while a task is running.',
        importance: AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#CB6747',
        showBadge: false,
      });
      channelOk = true;
    }
  } catch (e) {
    // Expo Go can reject channel setup. Notifications then use the default channel.
    console.warn('Notification channel setup failed', e);
  }
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('cheers', {
        name: 'Cheers',
        description: 'When someone cheers you on from your proof wall.',
        importance: AndroidImportance.DEFAULT,
        lightColor: '#CB6747',
      });
    } catch {
      // Cheers then use the default channel.
    }
  }
  try {
    await Notifications.setNotificationCategoryAsync(FOCUS_CATEGORY, [
      { identifier: ACTION_PROOF, buttonTitle: 'Add proof', options: { opensAppToForeground: true } },
    ]);
  } catch (e) {
    console.warn('Notification action setup failed', e);
  }
}

/** Channel settings for a notification, or nothing when the Focus channel could not be created. */
export const channelProps = (): { channelId?: string } => (channelOk ? { channelId: FOCUS_CHANNEL } : {});

/** Ask for notification permission if needed. Returns true when notifications can show. */
export async function ensurePermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

/** Show or update the pinned notification. Android keeps it from being swiped away (sticky). */
export async function presentPinned(input: { taskId: string; title: string; body: string }): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: PINNED_ID,
    content: {
      title: input.title,
      body: input.body,
      sticky: true,
      autoDismiss: false,
      categoryIdentifier: FOCUS_CATEGORY,
      data: { taskId: input.taskId },
      color: '#CB6747',
    },
    trigger: channelOk ? { channelId: FOCUS_CHANNEL } : null,
  });
}

/** Reminders after the run ends, in case the pinned one gets dismissed. They stop when proof is saved. */
export async function scheduleNags(input: { taskId: string; title: string; endAt: number }): Promise<void> {
  await cancelNags();
  for (let k = 0; k < NAG_COUNT; k++) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${NAG_PREFIX}${k}`,
      content: {
        title: k === 0 ? "Time's up" : 'Still on it?',
        body: `${input.title}: add proof to finish.`,
        categoryIdentifier: FOCUS_CATEGORY,
        data: { taskId: input.taskId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Math.max(Date.now() + 5000, input.endAt + k * NAG_EVERY_MS)),
        ...(channelOk ? { channelId: FOCUS_CHANNEL } : {}),
      },
    });
  }
}

export async function cancelNags(): Promise<void> {
  await Promise.all(
    Array.from({ length: NAG_COUNT }, (_, k) =>
      Notifications.cancelScheduledNotificationAsync(`${NAG_PREFIX}${k}`).catch(() => undefined),
    ),
  );
}

/** Remove the pinned notification and every reminder. Call after proof is saved. */
export async function clearFocus(): Promise<void> {
  await cancelNags();
  await Notifications.cancelScheduledNotificationAsync(PINNED_ID).catch(() => undefined);
  await Notifications.dismissNotificationAsync(PINNED_ID).catch(() => undefined);
}
