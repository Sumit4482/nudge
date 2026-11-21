import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card, PrimaryButton, SectionTitle } from '@/components/ui';
import { toast } from '@/lib/toast';
import { ensurePermission, setupNotifications } from '@/notifications/focus';
import { canNotify, scheduleDailies } from '@/notifications/nudges';
import { MY_TIMES } from '@/lib/times';
import { fmt } from '@/planner';
import { WallSection } from '@/features/settings/WallSection';
import { getSecret, setSecret, SECRET } from '@/services/secrets';
import { useApp } from '@/store/useApp';
import { FONT, usePhase } from '@/theme';

function Field({ label, value, onChange, secure, placeholder }: { label: string; value: string; onChange: (v: string) => void; secure?: boolean; placeholder: string }) {
  const { palette } = usePhase();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: palette.mute, fontFamily: FONT.bodySemi, fontSize: 11.5, letterSpacing: 1 }}>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor={palette.mute}
        accessibilityLabel={label}
        style={[styles.input, { borderColor: palette.line, color: palette.ink, backgroundColor: palette.card }]}
      />
    </View>
  );
}

function Row({ icon, title, sub, action }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string; action?: { label: string; onPress: () => void } }) {
  const { palette } = usePhase();
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={palette.ink} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.ink, fontFamily: FONT.bodySemi, fontSize: 14.5 }}>{title}</Text>
        <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5, marginTop: 1 }}>{sub}</Text>
      </View>
      {action ? (
        <Pressable accessibilityRole="button" accessibilityLabel={action.label} onPress={action.onPress} style={[styles.pill, { backgroundColor: palette.accent }]}>
          <Text style={{ color: palette.onAccent, fontFamily: FONT.bodyBold, fontSize: 12.5 }}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function Settings() {
  const { palette } = usePhase();
  const state = useApp();
  const [notify, setNotify] = useState(false);
  const [claude, setClaude] = useState('');

  const refresh = useCallback(async () => {
    setNotify(await canNotify());
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [n, a] = await Promise.all([canNotify(), getSecret(SECRET.anthropic)]);
      if (!alive) return;
      setNotify(n);
      setClaude(a);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const turnOnNotifications = async () => {
    await setupNotifications();
    const ok = await ensurePermission();
    if (ok) {
      const wind = MY_TIMES.sleep - 30;
      await scheduleDailies({ hour: Math.floor(wind / 60), minute: wind % 60 }, { hour: Math.floor(MY_TIMES.wake / 60), minute: MY_TIMES.wake % 60 });
    }
    await refresh();
    toast(ok ? 'Reminders are on.' : 'Allow notifications in Android settings.');
  };

  const exportData = async () => {
    const data = {
      exportedAt: new Date().toISOString(),
      xp: state.xp,
      streak: state.streak,
      tasks: state.tasks,
      done: state.done.map((d) => ({ ...d, proofUri: undefined, audioUri: undefined })),
      anchorLog: state.anchorLog,
      activity: state.activity,
      study: state.study,
      bills: state.bills,
    };
    try {
      await Share.share({ message: JSON.stringify(data, null, 2), title: 'Nudge export' });
    } catch {
      Alert.alert('Could not export', 'Try again.');
    }
  };

  const days = [...state.anchorLog].reverse().slice(0, 14);
  const logs = [...state.activity].reverse().slice(0, 10);

  return (
    <Screen>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back} hitSlop={10}>
        <Ionicons name="chevron-back" size={22} color={palette.hero} />
        <Text style={{ color: palette.hero, fontFamily: FONT.bodySemi, fontSize: 15 }}>Back</Text>
      </Pressable>
      <Text style={{ color: palette.hero, fontFamily: FONT.display, fontSize: 29, letterSpacing: -0.7, marginBottom: 16 }}>Settings</Text>

      <SectionTitle>Reminders and permissions</SectionTitle>
      <Card style={styles.block}>
        <Row icon="notifications-outline" title="Notifications" sub={notify ? 'On. Pinned task, check-ins, water, wind-down.' : 'Off. Needed for the pinned notification.'} action={notify ? undefined : { label: 'Turn on', onPress: turnOnNotifications }} />
        <Row icon="battery-charging-outline" title="Battery" sub={'Set Nudge to "Unrestricted" so reminders arrive on time.'} action={{ label: 'Open', onPress: () => Linking.openSettings() }} />
      </Card>

      <SectionTitle>Proof wall</SectionTitle>
      <WallSection />

      <SectionTitle>Task breakdown AI</SectionTitle>
      <Card style={styles.block}>
        <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13, lineHeight: 18 }}>
          Breakdowns use a free AI, no key needed. Only the task title and length are sent. Optional: paste an Anthropic key to use Claude instead. It stays on this phone in secure storage.
        </Text>
        <Field label="Claude key (optional)" value={claude} onChange={setClaude} secure placeholder="sk-ant-…" />
        <PrimaryButton label="Save key" onPress={async () => { await setSecret(SECRET.anthropic, claude.trim()); toast(claude.trim() ? 'Key saved.' : 'Key removed.'); }} />
      </Card>

      <SectionTitle>Your data</SectionTitle>
      <Card style={styles.block}>
        <Row icon="download-outline" title="Export" sub="Tasks, XP, history and study as text. Photos are not included." action={{ label: 'Export', onPress: exportData }} />
      </Card>

      <SectionTitle>Anchor history</SectionTitle>
      <Card style={styles.block}>
        {days.length ? (
          days.map((d) => (
            <View key={d.date} style={styles.hist}>
              <Text style={{ color: palette.ink, fontFamily: FONT.mono, fontSize: 12.5, width: 80 }}>{d.date.slice(5)}</Text>
              <Text style={{ color: palette.mute, fontFamily: FONT.mono, fontSize: 12, flex: 1 }}>
                {[d.wake != null && `wake ${fmt(d.wake)}`, d.leave != null && `out ${fmt(d.leave)}`, d.home != null && `home ${fmt(d.home)}`, d.sleep != null && `sleep ${fmt(d.sleep)}`].filter(Boolean).join('  ·  ') || '—'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13.5 }}>Tap an anchor on Today and it shows up here.</Text>
        )}
      </Card>

      <SectionTitle>Activity log</SectionTitle>
      <Card style={styles.block}>
        {logs.length ? (
          logs.map((l) => (
            <View key={l.at} style={styles.hist}>
              <Text style={{ color: palette.mute, fontFamily: FONT.mono, fontSize: 12, width: 56 }}>{new Date(l.at).toTimeString().slice(0, 5)}</Text>
              <Text style={{ color: palette.ink, fontFamily: FONT.body, fontSize: 13.5, flex: 1 }}>{l.text}</Text>
            </View>
          ))
        ) : (
          <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13.5 }}>Your check-in answers show up here.</Text>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 10, marginLeft: -6 },
  block: { padding: 16, gap: 14, marginBottom: 14, borderRadius: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pill: { height: 32, paddingHorizontal: 13, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  input: { height: 48, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, fontFamily: FONT.mono, fontSize: 14 },
  hist: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
