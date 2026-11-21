import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Sky } from '@/components/Sky';
import { AppServices } from '@/features/AppServices';
import { openTask, repostIfActive } from '@/focus/service';
import { useNow } from '@/hooks/useNow';
import { ACTION_PROOF, setupNotifications } from '@/notifications/focus';
import { useApp, whenHydrated } from '@/store/useApp';
import { FONT_FILES, PhaseProvider } from '@/theme';

SplashScreen.preventAutoHideAsync();

/** The navigator paints a grey background by default. Make it clear so the sky shows through. */
const TRANSPARENT_THEME = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent', card: 'transparent' } };

/** Starts a fresh day when the date changes. */
function DayKeeper() {
  const { date } = useNow();
  const ensureToday = useApp((s) => s.ensureToday);
  useEffect(() => {
    ensureToday(date);
  }, [date, ensureToday]);
  return null;
}

/** Opens the right screen when a notification (or its Add proof button) is tapped, and puts the pinned one back. */
function NotificationBridge() {
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    setupNotifications().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!response) return;
    const data = response.notification.request.content.data ?? {};
    const kind = data.kind;
    const taskId = data.taskId;
    const hasRun = !!useApp.getState().active;
    if (kind === 'checkin') router.push({ pathname: '/checkin', params: { s: String(data.s ?? ''), e: String(data.e ?? '') } });
    else if (kind === 'trigger' && typeof taskId === 'string') openTask(taskId);
    else if (kind === 'bill') router.navigate('/routines');
    else if (kind === 'cheer') router.navigate('/rewards');
    else if (kind === 'winddown' || kind === 'water') router.navigate('/');
    else if (hasRun && typeof taskId === 'string') router.push(response.actionIdentifier === ACTION_PROOF ? '/proof' : { pathname: '/focus', params: { id: taskId } });
    Notifications.clearLastNotificationResponse();
  }, [response]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') repostIfActive();
    });
    return () => sub.remove();
  }, []);

  return null;
}

const SHEET = { presentation: 'transparentModal', animation: 'slide_from_bottom' } as const;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => whenHydrated(() => setHydrated(true)), []);

  const ready = (fontsLoaded || fontError) && hydrated;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <PhaseProvider>
        <DayKeeper />
        {Platform.OS !== 'web' ? <NotificationBridge /> : null}
        {Platform.OS !== 'web' ? <AppServices /> : null}
        <View style={styles.root}>
          <Sky />
          <ThemeProvider value={TRANSPARENT_THEME}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
              <Stack.Screen name="focus" options={SHEET} />
              <Stack.Screen name="proof" options={SHEET} />
              <Stack.Screen name="checkin" options={SHEET} />
              <Stack.Screen name="why" options={SHEET} />
              <Stack.Screen name="snooze" options={SHEET} />
              <Stack.Screen name="stake" options={SHEET} />
              <Stack.Screen name="edit-task" options={SHEET} />
              <Stack.Screen name="edit-study" options={SHEET} />
              <Stack.Screen name="edit-goal" options={SHEET} />
              <Stack.Screen name="edit-bill" options={SHEET} />
              <Stack.Screen name="reward" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            </Stack>
          </ThemeProvider>
        </View>
      </PhaseProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
