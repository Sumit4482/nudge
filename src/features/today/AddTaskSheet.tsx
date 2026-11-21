import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '@/components/ui';
import { toast } from '@/lib/toast';
import { canAddMust, dueToday, dur, fmt, guessTag, MAX_MUST } from '@/planner';
import { breakdown } from '@/services/breakdown';
import { buildPlan } from '@/store/selectors';
import { useApp } from '@/store/useApp';
import { FONT } from '@/theme';
import type { Task } from '@/types';

const LENGTHS = [10, 15, 30, 45, 60, 90, 120, 180];
const TRIGGERS: { key: '' | NonNullable<Task['trigger']>['when']; label: string }[] = [
  { key: '', label: 'None' },
  { key: 'wake', label: 'When I wake' },
  { key: 'leave', label: 'When I leave' },
  { key: 'home', label: "When I'm home" },
];
const INK = '#2A1B33';
const MUTE = '#7C6B72';
const SOFT = '#F6EBE0';
const ACCENT = '#CB6747';

interface Props {
  visible: boolean;
  dow: number;
  onClose: () => void;
}

/** Bottom sheet for adding a task. Uses fixed warm colors so it reads in every sky. */
export function AddTaskSheet({ visible, dow, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {visible ? <Body dow={dow} onClose={onClose} /> : null}
    </Modal>
  );
}

/** Mounted only while the sheet is open, so every open starts with a clean form. */
function Body({ dow, onClose }: Omit<Props, 'visible'>) {
  const tasks = useApp((s) => s.tasks);
  const addTask = useApp((s) => s.addTask);
  const [title, setTitle] = useState('');
  const [mins, setMins] = useState(30);
  const [must, setMust] = useState(false);
  const [stake, setStake] = useState(false);
  const [trig, setTrig] = useState<'' | 'wake' | 'leave' | 'home'>('');
  const [steps, setSteps] = useState<string[] | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const mustOk = canAddMust(tasks, dow);
  const mustTitles = dueToday(tasks, dow).filter((t) => t.must).map((t) => t.title);

  const trimmed = title.trim();
  const big = mins >= 120 || trimmed.length > 38;

  const split = async () => {
    if (!trimmed || loading) return;
    setLoading(true);
    setNote('');
    const res = await breakdown(trimmed, mins, guessTag(trimmed));
    setSteps(res.steps);
    setNote(res.fromAi ? 'Steps made by Claude.' : (res.note ?? 'Sample steps.'));
    setLoading(false);
  };

  const submit = () => {
    if (!trimmed) return;
    const id = addTask({ title: trimmed, mins, must, stake, trigger: trig ? { when: trig } : undefined, steps: steps ?? undefined });
    const st = useApp.getState();
    const p = buildPlan(st, st.nowOverride ?? new Date().getHours() * 60 + new Date().getMinutes(), st.dowOverride ?? new Date().getDay(), st.date);
    const b = p.placed.find((x) => x.t.id === id);
    toast(b ? `Added. Placed at ${b.pred ? '~' : ''}${fmt(b.s)}.` : 'Added. Today is full, so it goes to tomorrow.');
    onClose();
  };

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.grab} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.h2}>{"What's the task?"}</Text>
            <Text style={styles.sub}>{"Dump it here. I'll find the slot."}</Text>
            <TextInput
              value={title}
              onChangeText={(v) => {
                setTitle(v);
                setSteps(null);
              }}
              placeholder="e.g. Finish the chemistry assignment"
              placeholderTextColor="#B7A8AE"
              maxLength={60}
              style={styles.input}
              accessibilityLabel="Task title"
              returnKeyType="done"
            />

            <Text style={styles.lab}>HOW LONG?</Text>
            <View style={styles.chips}>
              {LENGTHS.map((m) => (
                <Pressable key={m} onPress={() => setMins(m)} style={[styles.chip, mins === m && styles.chipOn]} accessibilityRole="button">
                  <Text style={[styles.chipText, mins === m && { color: '#fff' }]}>{dur(m)}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.lab}>IF-THEN PLAN</Text>
            <View style={styles.chips}>
              {TRIGGERS.map((t) => (
                <Pressable key={t.key} onPress={() => setTrig(t.key)} style={[styles.chip, trig === t.key && styles.chipOn]} accessibilityRole="button">
                  <Text style={[styles.chipText, { fontFamily: FONT.bodySemi, fontSize: 13 }, trig === t.key && { color: '#fff' }]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.toggle}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleText}>Must do today</Text>
                {!mustOk && !must ? (
                  <Text style={styles.small}>{`Max ${MAX_MUST} must-dos a day: ${mustTitles.join(', ')}. Clear one to add another.`}</Text>
                ) : null}
              </View>
              <Switch
                value={must}
                onValueChange={(v) => {
                  if (v && !mustOk) {
                    toast(`Already ${MAX_MUST} must-dos today. Clear one first.`);
                    return;
                  }
                  setMust(v);
                }}
                trackColor={{ false: '#E4D8CF', true: '#3F9F7F' }} thumbColor="#fff" accessibilityLabel="Must do today"
              />
            </View>
            <View style={styles.toggle}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleText}>Stake it</Text>
                <Text style={styles.small}>Lose 50 XP if you miss it today.</Text>
              </View>
              <Switch value={stake} onValueChange={setStake} trackColor={{ false: '#E4D8CF', true: '#3F9F7F' }} thumbColor="#fff" accessibilityLabel="Stake it" />
            </View>

            {loading ? <Text style={[styles.small, { marginTop: 14 }]}>Splitting it into small steps…</Text> : null}
            {steps ? (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.lab}>{note.toUpperCase()}</Text>
                {steps.map((s, i) => (
                  <View key={`${i}-${s}`} style={styles.step}>
                    <View style={styles.stepNum}>
                      <Text style={{ fontFamily: FONT.mono, fontSize: 11, color: MUTE }}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{s}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={{ gap: 10, marginTop: 18 }}>
              <Pressable
                onPress={split}
                disabled={!trimmed || loading}
                style={[styles.secondary, big && { backgroundColor: ACCENT }, (!trimmed || loading) && { opacity: 0.4 }]}
                accessibilityRole="button"
              >
                <Ionicons name="sparkles-outline" size={20} color={big ? '#fff' : INK} />
                <Text style={[styles.secondaryText, big && { color: '#fff' }]}>Break it down</Text>
              </Pressable>
              <PrimaryButton label="Add to my day" disabled={!trimmed} onPress={submit} style={{ backgroundColor: ACCENT }} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(14,16,40,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFAF4', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingTop: 10, maxHeight: '92%' },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 5, backgroundColor: 'rgba(42,27,51,0.18)', marginBottom: 14 },
  h2: { fontFamily: FONT.displayBold, fontSize: 24, color: INK, letterSpacing: -0.5 },
  sub: { fontFamily: FONT.body, fontSize: 14, color: MUTE, marginTop: 4, marginBottom: 16 },
  input: { height: 54, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(42,27,51,0.12)', backgroundColor: '#fff', paddingHorizontal: 16, fontFamily: FONT.bodySemi, fontSize: 17, color: INK },
  lab: { fontFamily: FONT.bodySemi, fontSize: 11.5, letterSpacing: 1.3, color: MUTE, marginTop: 18, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 12, backgroundColor: SOFT, justifyContent: 'center' },
  chipOn: { backgroundColor: INK },
  chipText: { fontFamily: FONT.mono, fontSize: 14, color: INK },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, gap: 12 },
  toggleText: { fontFamily: FONT.bodySemi, fontSize: 15, color: INK },
  small: { fontFamily: FONT.body, fontSize: 12.5, color: MUTE },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: SOFT, borderRadius: 14, padding: 11, marginBottom: 8 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1, fontFamily: FONT.bodySemi, fontSize: 14.5, color: INK },
  secondary: { height: 54, borderRadius: 18, backgroundColor: SOFT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  secondaryText: { fontFamily: FONT.display, fontSize: 16, color: INK },
});
