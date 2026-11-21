import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { fmt } from '@/planner';
import { useApp } from '@/store/useApp';
import { FONT, usePhase } from '@/theme';

function Btn({ label, onPress, on }: { label: string; onPress: () => void; on?: boolean }) {
  const { palette } = usePhase();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.btn, { backgroundColor: on ? palette.accent : palette.line, opacity: pressed ? 0.8 : 1 }]}
    >
      <Text style={{ color: on ? palette.onAccent : palette.ink, fontFamily: FONT.bodySemi, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

/** Development only: move the clock and switch the day type to test early-home, late-wake and weekends. */
export function DemoPanel({ now, dow }: { now: number; dow: number }) {
  const { palette } = usePhase();
  const [open, setOpen] = useState(false);
  const setOverride = useApp((s) => s.setOverride);
  const dowOverride = useApp((s) => s.dowOverride);
  const rest = useApp((s) => s.rest);
  const setRest = useApp((s) => s.setRest);
  const resetDay = useApp((s) => s.resetDay);
  const move = (d: number) => setOverride(Math.max(0, Math.min(1439, now + d)), dowOverride ?? dow);

  return (
    <View style={{ marginBottom: 14 }}>
      <Pressable accessibilityRole="button" onPress={() => setOpen((o) => !o)} style={styles.toggle}>
        <Ionicons name="settings-outline" size={15} color={palette.heroMute} />
        <Text style={{ color: palette.heroMute, fontFamily: FONT.bodySemi, fontSize: 12.5 }}>{open ? 'Hide demo controls' : 'Demo controls (dev only)'}</Text>
      </Pressable>
      {open ? (
        <Card style={{ gap: 12 }}>
          <Text style={{ color: palette.mute, fontFamily: FONT.mono, fontSize: 12 }}>{`Clock ${fmt(now)}`}</Text>
          <View style={styles.row}>
            <Btn label="−1h" onPress={() => move(-60)} />
            <Btn label="−15m" onPress={() => move(-15)} />
            <Btn label="+15m" onPress={() => move(15)} />
            <Btn label="+1h" onPress={() => move(60)} />
          </View>
          <View style={styles.row}>
            {[['07:30', 450], ['09:00', 540], ['12:00', 720], ['17:40', 1060], ['21:00', 1260]].map(([l, m]) => (
              <Btn key={l} label={String(l)} onPress={() => setOverride(Number(m), dowOverride ?? dow)} />
            ))}
          </View>
          <View style={styles.row}>
            <Btn label="Real time" onPress={() => setOverride(null, null)} />
            <Btn label="Wed" on={dow === 3 && dowOverride != null} onPress={() => setOverride(now, 3)} />
            <Btn label="Sat" on={dow === 6 && dowOverride != null} onPress={() => setOverride(now, 6)} />
            <Btn label="Sun" on={dow === 0 && dowOverride != null} onPress={() => setOverride(now, 0)} />
          </View>
          <View style={styles.row}>
            <Btn label="Normal" on={rest === 'normal'} onPress={() => setRest('normal')} />
            <Btn label="Travel" on={rest === 'travel'} onPress={() => setRest('travel')} />
            <Btn label="Sick" on={rest === 'sick'} onPress={() => setRest('sick')} />
            <Btn label="Reset day" onPress={resetDay} />
          </View>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btn: { paddingHorizontal: 14, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
