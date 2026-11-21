import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ring } from '@/components/Ring';
import { TAG_META } from '@/components/tagMeta';
import { PrimaryButton } from '@/components/ui';
import { advanceStep, extendFocus, startFocus } from '@/focus/service';
import { useNow } from '@/hooks/useNow';
import { useTick } from '@/hooks/useTick';
import { toast } from '@/lib/toast';
import { dur } from '@/planner';
import { useApp } from '@/store/useApp';
import { FONT, TAG_COLORS } from '@/theme';

const INK = '#2A1B33';
const MUTE = '#7C6B72';
const SOFT = '#F6EBE0';
const ACCENT = '#CB6747';

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

function Chip({ icon, label, on, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; on?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.chip, on && { backgroundColor: ACCENT }]}>
      <Ionicons name={icon} size={17} color={on ? '#fff' : INK} />
      <Text style={[styles.chipText, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

/** The focus sheet: pick a run, see the current step, then add proof to finish. */
export default function Focus() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const active = useApp((s) => s.active);
  const tasks = useApp((s) => s.tasks);
  const snoozes = useApp((s) => s.snoozes);
  const date = useApp((s) => s.date);
  const setStake = useApp((s) => s.setStake);
  const { now } = useNow();
  const nowMs = useTick(1000);
  const task = tasks.find((t) => t.id === (active?.taskId ?? id));

  useEffect(() => {
    if (!task) router.back();
  }, [task]);
  if (!task) return null;

  const steps = task.steps;
  const total = active ? active.runMins * 60000 : 0;
  const elapsed = active ? nowMs - active.startAt : 0;
  const ended = !!active && elapsed >= total;
  const pct = active ? Math.min(1, elapsed / total) : 0;
  const stepIdx = active?.step ?? 0;
  const color = TAG_COLORS[task.tag];
  const used = snoozes[task.id]?.date === date ? snoozes[task.id].n : 0;
  const left = Math.max(0, 2 - used);

  const snooze = () => {
    const res = useApp.getState().snooze(task.id, now);
    if (res === 'blocked') {
      router.replace({ pathname: '/snooze', params: { id: task.id } });
      return;
    }
    router.back();
    toast(`Snoozed 15 minutes. ${left - 1} snooze${left - 1 === 1 ? '' : 's'} left today.`);
  };

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} accessibilityLabel="Close" />
      <View style={styles.sheet}>
        <View style={styles.grab} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.tagRow}>
            <Ionicons name={TAG_META[task.tag].icon} size={16} color={color} />
            <Text style={[styles.tag, { color }]}>{`${TAG_META[task.tag].label.toUpperCase()}${task.must ? ' · MUST DO' : ''}${task.stake ? ' · STAKED' : ''}`}</Text>
          </View>
          <Text style={styles.h2}>{task.title}</Text>

          <View style={styles.timer}>
            <Ring size={216} stroke={12} pct={pct} color={ended ? '#5FA88A' : ACCENT} track={SOFT}>
              <Text style={styles.big}>{active ? mmss(total - elapsed) : mmss(task.mins * 60000)}</Text>
              <Text style={styles.small}>{ended ? "Time's up" : active ? (active.pomodoro ? 'Pomodoro' : 'in focus') : `${dur(task.mins)} planned`}</Text>
            </Ring>
          </View>

          {steps?.length ? (
            <View style={styles.stepBox}>
              <Text style={styles.lab}>{`STEP ${stepIdx + 1} OF ${steps.length}`}</Text>
              <Text style={styles.step}>{steps[stepIdx]}</Text>
              <View style={styles.dots}>
                {steps.map((s, i) => (
                  <View key={`${i}-${s}`} style={[styles.dot, i <= stepIdx && { backgroundColor: ACCENT }]} />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.stack}>
            {!active ? (
              <>
                <PrimaryButton label="Just 5 minutes" icon="flash-outline" onPress={() => startFocus(task.id, 5)} style={{ backgroundColor: ACCENT }} />
                <Pressable accessibilityRole="button" onPress={() => startFocus(task.id, task.mins)} style={styles.secondary}>
                  <Text style={styles.secondaryText}>{`Start ${dur(task.mins)} focus`}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="I already did this"
                  onPress={() => {
                    useApp.getState().startRun(task.id, 1);
                    router.replace('/proof');
                  }}
                  style={styles.secondary}
                >
                  <Ionicons name="checkmark-done-outline" size={20} color={INK} />
                  <Text style={styles.secondaryText}>I already did this</Text>
                </Pressable>
                {task.tag === 'study' ? (
                  <Pressable accessibilityRole="button" onPress={() => startFocus(task.id, 25, true)} style={styles.secondary}>
                    <Ionicons name="timer-outline" size={20} color={INK} />
                    <Text style={styles.secondaryText}>Pomodoro 25 + 5</Text>
                  </Pressable>
                ) : null}
                <View style={styles.chips}>
                  <Chip icon="shield-outline" label={task.stake ? 'Staked' : 'Stake it'} on={!!task.stake} onPress={() => { setStake(task.id, !task.stake); toast(task.stake ? 'Stake removed.' : 'Staked. Miss it today and you lose 50 XP.'); }} />
                  <Chip icon="time-outline" label={`Snooze · ${left} left`} onPress={snooze} />
                  <Chip icon="help-circle-outline" label="Avoiding?" onPress={() => router.replace({ pathname: '/why', params: { id: task.id } })} />
                  <Chip icon="create-outline" label="Edit" onPress={() => router.push({ pathname: '/edit-task', params: { id: task.id } })} />
                </View>
                <Text style={styles.fine}>Starting is the hard part. Five minutes is allowed to be bad.</Text>
              </>
            ) : ended ? (
              <>
                <PrimaryButton label="Add proof to finish" icon="camera-outline" onPress={() => router.replace('/proof')} style={{ backgroundColor: ACCENT }} />
                <Pressable accessibilityRole="button" onPress={() => extendFocus(active.pomodoro ? 5 : 10)} style={styles.secondary}>
                  <Text style={styles.secondaryText}>{active.pomodoro ? 'Take a 5 minute break' : '+10 more minutes'}</Text>
                </Pressable>
              </>
            ) : (
              <>
                {steps && stepIdx < steps.length - 1 ? (
                  <Pressable accessibilityRole="button" onPress={() => advanceStep()} style={styles.secondary}>
                    <Text style={styles.secondaryText}>Step done, next</Text>
                  </Pressable>
                ) : null}
                <PrimaryButton label="Finished: add proof" icon="camera-outline" onPress={() => router.replace('/proof')} style={{ backgroundColor: ACCENT }} />
                <View style={styles.lockRow}>
                  <Ionicons name="lock-closed-outline" size={13} color={MUTE} />
                  <Text style={styles.fine}>The notification stays pinned until you upload proof.</Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(14,16,40,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFAF4', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingTop: 10, maxHeight: '92%' },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 5, backgroundColor: 'rgba(42,27,51,0.18)', marginBottom: 14 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  tag: { fontFamily: FONT.bodySemi, fontSize: 12, letterSpacing: 1 },
  h2: { fontFamily: FONT.displayBold, fontSize: 24, color: INK, letterSpacing: -0.5 },
  timer: { alignItems: 'center', marginVertical: 18 },
  big: { fontFamily: FONT.mono, fontSize: 44, color: INK, letterSpacing: -1.5 },
  small: { fontFamily: FONT.body, fontSize: 12, color: MUTE, marginTop: 2 },
  stepBox: { backgroundColor: SOFT, borderRadius: 20, padding: 16 },
  lab: { fontFamily: FONT.bodySemi, fontSize: 11, letterSpacing: 1.2, color: MUTE },
  step: { fontFamily: FONT.display, fontSize: 17, color: INK, marginTop: 6, lineHeight: 22 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 12 },
  dot: { flex: 1, height: 5, borderRadius: 5, backgroundColor: 'rgba(42,27,51,0.12)' },
  stack: { gap: 10, marginTop: 18 },
  secondary: { height: 54, borderRadius: 18, backgroundColor: SOFT, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: FONT.display, fontSize: 16, color: INK },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, paddingHorizontal: 13, borderRadius: 14, backgroundColor: SOFT },
  chipText: { fontFamily: FONT.bodySemi, fontSize: 13, color: INK },
  fine: { fontFamily: FONT.body, fontSize: 12, color: MUTE, textAlign: 'center', lineHeight: 17 },
  lockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
