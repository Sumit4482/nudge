import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, SectionTitle, TagIcon } from '@/components/ui';
import { Screen } from '@/components/Screen';
import { RoutineCard } from '@/features/routines/RoutineCard';
import { useNow } from '@/hooks/useNow';
import { DAY_SHORT } from '@/lib/date';
import { shortDate } from '@/lib/dates';
import { toast } from '@/lib/toast';
import type { RestMode } from '@/lib/copy';
import { choreFor, daysUntil, upcomingDue } from '@/life/logic';
import { fmt } from '@/planner';
import { useApp, type WorkoutTemplate } from '@/store/useApp';
import { FONT, usePhase } from '@/theme';

const TEMPLATES: WorkoutTemplate[] = [
  { name: 'Strength A: push and legs', mins: 30, ex: ['Push-ups 3 x 8-12', 'Squats 3 x 15', 'Glute bridges 3 x 15', 'Plank 3 x 30s', 'Pike push-ups 2 x 6-8', 'Wall sit 45s'] },
  { name: 'Strength B: pull and core', mins: 30, ex: ['Table rows 3 x 8-10', 'Reverse lunges 3 x 10 each leg', 'Superman holds 3 x 12', 'Dead bug 3 x 10 each side', 'Side plank 2 x 20s each side'] },
  { name: 'Strength C: full body', mins: 30, ex: ['Squat to reach 3 x 15', 'Push-ups 3 x 8-12', 'Chair split squats 3 x 8 each leg', 'Single-leg glute bridge 3 x 10 each leg', 'Mountain climbers 30s', 'Bear crawl 30s'] },
  { name: 'Mobility and core', mins: 20, ex: ['Cat-cow 10', 'Child pose 45s', 'Hip flexor stretch 45s each side', 'Bird-dog 2 x 8 each side', 'Dead bug 2 x 8 each side', 'Plank 30s'] },
];
const MODES: { key: RestMode; label: string }[] = [
  { key: 'normal', label: 'Normal' },
  { key: 'travel', label: 'Travel' },
  { key: 'sick', label: 'Sick' },
];
const UNTIL: { label: string; days: number | null }[] = [
  { label: 'Tomorrow', days: 1 },
  { label: '3 days', days: 3 },
  { label: 'A week', days: 7 },
  { label: 'No end date', days: null },
];

function SmallButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  const { palette } = usePhase();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.small, { backgroundColor: palette.accent, opacity: pressed ? 0.85 : 1 }]}>
      {icon ? <Ionicons name={icon} size={12} color={palette.onAccent} /> : null}
      <Text style={{ color: palette.onAccent, fontFamily: FONT.bodyBold, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

export default function Routines() {
  const { palette } = usePhase();
  const { dow, date } = useNow();
  const tasks = useApp((s) => s.tasks);
  const rest = useApp((s) => s.rest);
  const restUntil = useApp((s) => s.restUntil);
  const setRest = useApp((s) => s.setRest);
  const setRestUntilDays = useApp((s) => s.setRestUntilDays);
  const choreOffset = useApp((s) => s.choreOffset);
  const rotate = useApp((s) => s.rotateChores);
  const bills = useApp((s) => s.bills);
  const addWorkout = useApp((s) => s.addWorkout);
  const routines = tasks.filter((t) => t.routine);
  const paused = rest !== 'normal';

  return (
    <Screen>
      <Text style={{ color: palette.hero, fontFamily: FONT.display, fontSize: 29, letterSpacing: -0.7, marginBottom: 4 }}>Routines</Text>
      <Text style={{ color: palette.heroMute, fontFamily: FONT.body, fontSize: 14.5, lineHeight: 20, marginBottom: 18 }}>
        They repeat on their own and land in your plan first. Every step needs proof.
      </Text>

      <Card style={styles.block}>
        <View style={styles.inline}>
          <Ionicons name="heart-outline" size={18} color={palette.ink} />
          <Text style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 17 }}>Rest mode</Text>
        </View>
        <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 19 }}>
          Travelling or unwell? Pause routines without breaking your streak. Nothing counts as missed, and sick days keep reminders quiet.
        </Text>
        <View style={[styles.seg, { backgroundColor: palette.line }]}>
          {MODES.map((m) => (
            <Pressable key={m.key} accessibilityRole="button" onPress={() => setRest(m.key, m.key === 'normal' ? null : 1)} style={[styles.segBtn, rest === m.key && { backgroundColor: palette.card }]}>
              <Text style={{ color: rest === m.key ? palette.ink : palette.mute, fontFamily: FONT.bodySemi, fontSize: 13 }}>{m.label}</Text>
            </Pressable>
          ))}
        </View>
        {paused ? (
          <>
            <Text style={{ color: palette.mute, fontFamily: FONT.bodySemi, fontSize: 11, letterSpacing: 1.2 }}>REST UNTIL</Text>
            <View style={styles.wrap}>
              {UNTIL.map((u) => {
                const on = u.days == null ? !restUntil : restUntil === (date ? addToDate(date, u.days) : '');
                return (
                  <Pressable key={u.label} accessibilityRole="button" onPress={() => { setRestUntilDays(u.days); toast(u.days == null ? 'Rest mode stays on until you end it.' : `Rest mode lasts ${u.label.toLowerCase()}.`); }} style={[styles.chip, { backgroundColor: on ? palette.accent : palette.line }]}>
                    <Text style={{ color: on ? palette.onAccent : palette.ink, fontFamily: FONT.bodySemi, fontSize: 12.5 }}>{u.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
      </Card>

      {routines.map((t) => (
        <RoutineCard key={t.id} task={t} paused={paused} />
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add routine"
        onPress={() => router.push({ pathname: '/edit-task', params: { mode: 'routine' } })}
        style={[styles.addRow, { borderColor: palette.line }]}
      >
        <Ionicons name="add" size={18} color={palette.ink} />
        <Text style={{ color: palette.ink, fontFamily: FONT.bodySemi, fontSize: 14.5 }}>Add a routine</Text>
      </Pressable>

      <SectionTitle>Workout templates</SectionTitle>
      {TEMPLATES.map((t) => (
        <Card key={t.name} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TagIcon tag="fit" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 15.5 }}>{t.name}</Text>
            <Text numberOfLines={1} style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5, marginTop: 2 }}>{`${t.ex.slice(0, 3).join(' · ')}…`}</Text>
          </View>
          <SmallButton label="Use today" onPress={() => { addWorkout(t); toast(`${t.name} added to today.`); router.navigate('/'); }} />
        </Card>
      ))}

      <SectionTitle>Chore rotation</SectionTitle>
      <Card style={styles.block}>
        <View style={styles.strip}>
          {[1, 2, 3, 4, 5].map((d) => (
            <View key={d} style={[styles.stripItem, { backgroundColor: d === dow ? palette.accent : palette.line }]}>
              <Text style={{ color: d === dow ? palette.onAccent : palette.mute, fontFamily: FONT.mono, fontSize: 10.5 }}>{DAY_SHORT[d]}</Text>
              <Text style={{ color: d === dow ? palette.onAccent : palette.ink, fontFamily: FONT.bodySemi, fontSize: 10.5, textAlign: 'center', marginTop: 3 }}>{choreFor(d, choreOffset)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.between}>
          <Text style={{ flex: 1, color: palette.mute, fontFamily: FONT.body, fontSize: 12.5 }}>One chore a weekday, 15 minutes. Today&apos;s is added to your plan.</Text>
          <SmallButton label="Rotate" icon="repeat" onPress={() => { rotate(); toast('Chores rotated.'); }} />
        </View>
      </Card>

      <SectionTitle>Bills and payments</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {bills.map((b, i) => {
          const due = upcomingDue(b, date);
          const left = daysUntil(due, date);
          return (
            <View key={b.id} style={[styles.bill, i > 0 && { borderTopWidth: 1, borderTopColor: palette.line }]}>
              <TagIcon tag="life" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 15.5 }}>{b.title}</Text>
                <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5, marginTop: 2 }}>{`Due ${shortDate(due)} · ${left === 0 ? 'today' : `in ${left} day${left === 1 ? '' : 's'}`}`}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${b.title}`} onPress={() => router.push({ pathname: '/edit-bill', params: { id: b.id } })} hitSlop={8} style={{ padding: 6 }}>
                <Ionicons name="create-outline" size={18} color={palette.mute} />
              </Pressable>
              <SmallButton label="Mark paid" onPress={() => router.push({ pathname: '/proof', params: { bill: b.id, due } })} />
            </View>
          );
        })}
        {bills.length === 0 ? <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13, padding: 10 }}>No bills yet. Add one to get reminders.</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Add bill" onPress={() => router.push('/edit-bill')} style={[styles.addRow, { borderColor: palette.line, margin: 10, marginTop: 4 }]}>
          <Ionicons name="add" size={18} color={palette.ink} />
          <Text style={{ color: palette.ink, fontFamily: FONT.bodySemi, fontSize: 14.5 }}>Add a bill</Text>
        </Pressable>
        <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5, padding: 10, paddingTop: 4 }}>
          Reminders 3 days before and on the day, at {fmt(540)}. Paying needs a screenshot as proof.
        </Text>
      </Card>
    </Screen>
  );
}

/** YYYY-MM-DD plus n days, without time zones. */
function addToDate(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  block: { padding: 16, gap: 12, marginBottom: 12, borderRadius: 24 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seg: { flexDirection: 'row', borderRadius: 14, padding: 3, gap: 3 },
  segBtn: { flex: 1, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 32, paddingHorizontal: 13, borderRadius: 99, justifyContent: 'center' },
  small: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 32, paddingHorizontal: 12, borderRadius: 11 },
  strip: { flexDirection: 'row', gap: 6 },
  stripItem: { flex: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 3, alignItems: 'center', minWidth: 0 },
  bill: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10 },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 12 },
});
