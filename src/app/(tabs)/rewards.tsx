import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Image, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Garden } from '@/components/Garden';
import { NEXT_STAGE_AT, STAGE_NAMES, gardenStage, unlockedPots } from '@/garden';
import { MIN_SAMPLES, learnedTimes } from '@/planner/learned';
import { MY_TIMES } from '@/lib/times';
import { fmt, isDue } from '@/planner';
import { addDays } from '@/lib/dates';
import { CheersCard } from '@/features/rewards/CheersCard';
import { removeFromWall } from '@/wall/api';
import { Card, PrimaryButton, SectionTitle } from '@/components/ui';
import { Ring } from '@/components/Ring';
import { Screen } from '@/components/Screen';
import { TAG_META } from '@/components/tagMeta';
import { useNow } from '@/hooks/useNow';
import { DAY_SHORT } from '@/lib/date';
import { level, XP_PER_LEVEL, xpIntoLevel } from '@/rewards';
import { useApp } from '@/store/useApp';
import { FONT, TAG_COLORS, usePhase } from '@/theme';
import type { Tag } from '@/types';

/** Weekly base counts and targets until real history exists. */
const BASE: Record<Tag, [number, number]> = { fit: [3, 4], study: [4, 6], life: [2, 5] };
const GOALS = [500, 1000, 1500, 2500, 4000];
const INK = '#2A1B33';
const MUTE = '#7C6B72';
const SOFT = '#F6EBE0';
const ACCENT = '#CB6747';

function RewardEditor({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const reward = useApp((s) => s.reward);
  const setReward = useApp((s) => s.setReward);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {visible ? <EditorBody key={`${reward.name}${reward.goal}`} initial={reward} onSave={(r) => { setReward(r); onClose(); }} onClose={onClose} /> : null}
    </Modal>
  );
}

function EditorBody({ initial, onSave, onClose }: { initial: { name: string; goal: number }; onSave: (r: { name: string; goal: number }) => void; onClose: () => void }) {
  const [name, setName] = useState(initial.name);
  const [goal, setGoal] = useState(initial.goal);
  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      <View style={styles.sheet}>
        <View style={styles.grab} />
        <Text style={styles.h2}>Your weekly reward</Text>
        <Text style={styles.subtle}>Pick something you actually want. You earn it with XP.</Text>
        <TextInput value={name} onChangeText={setName} maxLength={40} placeholder="Movie night" placeholderTextColor="#B7A8AE" style={styles.input} accessibilityLabel="Reward name" />
        <Text style={styles.lab}>XP NEEDED</Text>
        <View style={styles.chips}>
          {GOALS.map((g) => (
            <Pressable key={g} accessibilityRole="button" onPress={() => setGoal(g)} style={[styles.chip, goal === g && { backgroundColor: INK }]}>
              <Text style={{ fontFamily: FONT.mono, fontSize: 14, color: goal === g ? '#fff' : INK }}>{g.toLocaleString()}</Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton label="Save reward" disabled={!name.trim()} onPress={() => onSave({ name: name.trim(), goal })} style={{ backgroundColor: ACCENT, marginTop: 18 }} />
      </View>
    </View>
  );
}

export default function Rewards() {
  const { palette } = usePhase();
  const xp = useApp((s) => s.xp);
  const streak = useApp((s) => s.streak);
  const done = useApp((s) => s.done);
  const date = useApp((s) => s.date);
  const reward = useApp((s) => s.reward);
  const { dow } = useNow();
  const [editing, setEditing] = useState(false);
  const rest = useApp((s) => s.rest);
  const goals = useApp((s) => s.goals);
  const study = useApp((s) => s.study);
  const tasks = useApp((s) => s.tasks);
  const learned = useApp((s) => s.learned);
  const anchorLog = useApp((s) => s.anchorLog);
  const setLearned = useApp((s) => s.setLearned);
  const learnt = useMemo(() => learnedTimes(anchorLog), [anchorLog]);
  const goalRows = useMemo(() => {
    const month = date.slice(0, 7);
    const week = new Set(Array.from({ length: 7 }, (_, i) => addDays(date, -i)));
    return goals.map((g) => {
      if (g.kind === 'tag') {
        const have = g.base + done.filter((d) => d.tag === g.tag && d.date.startsWith(month)).length;
        const weekTarget = Math.max(1, Math.ceil(g.target / 4));
        const weekHave = Math.min(weekTarget, done.filter((d) => d.tag === g.tag && week.has(d.date)).length);
        const today = tasks.find((t) => t.tag === g.tag && isDue(t, dow, date));
        return { id: g.id, title: g.title, sub: g.sub, have, target: g.target, weekLabel: `${weekTarget} ${g.tag === 'fit' ? 'workouts' : 'tasks'}`, weekHave, weekTarget, today: today?.title ?? '' };
      }
      const chapters = study.chapters[g.subject ?? ''] ?? [];
      const have = chapters.filter((c) => c.s === 2).length;
      const weekHave = Math.min(1, done.filter((d) => d.tag === 'study' && week.has(d.date)).length);
      const today = tasks.find((t) => !t.done && t.subject === g.subject);
      return { id: g.id, title: g.title, sub: g.sub, have, target: Math.max(1, Math.min(g.target, chapters.length || g.target)), weekLabel: 'revise 1 topic', weekHave, weekTarget: 1, today: today?.title ?? '' };
    });
  }, [goals, done, date, study, tasks, dow]);

  const lv = level(xp);
  const doneToday = done.filter((d) => d.date === date).length;
  const proofs = done.filter((d) => d.proofUri);
  const history = [...done].sort((a, b) => b.at - a.at).slice(0, 8);
  const cnt = (tag: Tag) => Math.min(BASE[tag][1], BASE[tag][0] + done.filter((d) => d.tag === tag && d.date === date).length);

  return (
    <Screen>
      <View style={styles.between}>
        <Text style={[styles.h1, { color: palette.hero, fontFamily: FONT.display }]}>You</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} hitSlop={10}>
          <Ionicons name="settings-outline" size={24} color={palette.hero} />
        </Pressable>
      </View>
      <Text style={[styles.sub, { color: palette.heroMute, fontFamily: FONT.body }]}>Every proof you upload grows your garden.</Text>

      <Card style={styles.block}>
        <View style={styles.inline}>
          <Ionicons name="leaf-outline" size={18} color={palette.ink} />
          <Text style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 17 }}>{`Garden · ${STAGE_NAMES[gardenStage(streak)]}`}</Text>
        </View>
        <Garden streak={streak} level={lv} ink={palette.ink} />
        <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 18 }}>
          {`${rest !== 'normal' ? 'Streak frozen while you rest. ' : ''}${streak}-day streak${NEXT_STAGE_AT[gardenStage(streak)] ? `. Next stage at ${NEXT_STAGE_AT[gardenStage(streak)]} days.` : '. Fully grown.'} Level ${lv}: ${unlockedPots(lv)} of 5 plants unlocked. Missed days never hurt it; it rests.`}
        </Text>
      </Card>

      <Card style={styles.row}>
        <Ring size={112} stroke={9} pct={xpIntoLevel(xp) / XP_PER_LEVEL} color={palette.accent} track={palette.line}>
          <Text style={{ color: palette.ink, fontFamily: FONT.displayBold, fontSize: 34 }}>{lv}</Text>
        </Ring>
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 20 }}>{`Level ${lv}`}</Text>
          <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13.5, marginTop: 3, lineHeight: 19 }}>
            {`${XP_PER_LEVEL - xpIntoLevel(xp)} XP to level ${lv + 1}.\n${xp.toLocaleString()} XP total.`}
          </Text>
        </View>
      </Card>

      <Card style={styles.block}>
        <View style={styles.between}>
          <View style={styles.inline}>
            <Ionicons name="flame-outline" size={20} color={palette.ink} />
            <Text style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 17 }}>Streak</Text>
          </View>
          <Text style={{ color: palette.accent, fontFamily: FONT.displayBold, fontSize: 30 }}>
            {streak}
            <Text style={{ color: palette.mute, fontFamily: FONT.bodySemi, fontSize: 14 }}> days</Text>
          </Text>
        </View>
        <View style={styles.week}>
          {Array.from({ length: 7 }, (_, i) => {
            const back = 6 - i;
            const d = (dow - back + 7) % 7;
            const on = back > 0 || doneToday > 0;
            return (
              <View key={i} style={styles.dayCol}>
                <View style={[styles.dayDot, { backgroundColor: on ? palette.accent : palette.line }]}>
                  {on ? <Ionicons name="checkmark" size={16} color={palette.onAccent} /> : null}
                </View>
                <Text style={{ color: palette.mute, fontFamily: FONT.mono, fontSize: 11 }}>{DAY_SHORT[d][0]}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <SectionTitle>Goals</SectionTitle>
      <Card style={styles.block}>
        {goalRows.map((g, i) => (
          <View key={g.id} style={[{ gap: 8 }, i > 0 && { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 14 }]}>
            <View style={styles.inline}>
              <Ionicons name="flag-outline" size={18} color={palette.ink} />
              <Text style={{ flex: 1, color: palette.ink, fontFamily: FONT.display, fontSize: 16 }}>{g.title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${g.title}`} onPress={() => router.push({ pathname: '/edit-goal', params: { id: g.id } })} hitSlop={8}>
                <Ionicons name="create-outline" size={18} color={palette.mute} />
              </Pressable>
            </View>
            <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5 }}>{g.sub}</Text>
            <View style={[styles.bar, { backgroundColor: palette.line }]}>
              <View style={{ width: `${Math.min(100, (g.have / g.target) * 100)}%`, height: '100%', backgroundColor: palette.accent, borderRadius: 10 }} />
            </View>
            <View style={styles.between}>
              <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5 }}>Month</Text>
              <Text style={{ color: palette.ink, fontFamily: FONT.mono, fontSize: 12.5 }}>{`${g.have}/${g.target}`}</Text>
            </View>
            <View style={styles.between}>
              <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5 }}>{`This week: ${g.weekLabel}`}</Text>
              <Text style={{ color: palette.ink, fontFamily: FONT.mono, fontSize: 12.5 }}>{`${g.weekHave}/${g.weekTarget}`}</Text>
            </View>
            {g.today ? (
              <View style={styles.between}>
                <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5 }}>Today</Text>
                <Text numberOfLines={1} style={{ color: palette.ink, fontFamily: FONT.bodySemi, fontSize: 12.5, flex: 1, textAlign: 'right', marginLeft: 12 }}>{g.today}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </Card>
      <Pressable accessibilityRole="button" accessibilityLabel="Add goal" onPress={() => router.push('/edit-goal')} style={[styles.addGoal, { borderColor: palette.line }]}>
        <Ionicons name="add" size={18} color={palette.ink} />
        <Text style={{ color: palette.ink, fontFamily: FONT.bodySemi, fontSize: 14.5 }}>Add a goal</Text>
      </Pressable>

      <Card style={styles.block}>
        <View style={styles.inline}>
          <Ionicons name="time-outline" size={18} color={palette.ink} />
          <Text style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 17 }}>Your rhythm</Text>
        </View>
        <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 19 }}>
          {learnt.leave != null && learnt.home != null
            ? `From your last ${learnt.samples} weekdays: leave around ${fmt(learnt.leave)}, home around ${fmt(learnt.home)}. Your usual defaults are ${fmt(MY_TIMES.leave)} and ${fmt(MY_TIMES.home)}.`
            : `Learning your real times: ${learnt.samples} of ${MIN_SAMPLES} weekdays so far. Tap Leaving and Home on workdays and this fills in.`}
        </Text>
        <View style={styles.between}>
          <Text style={{ color: palette.ink, fontFamily: FONT.bodySemi, fontSize: 14 }}>Use my real times</Text>
          <Switch
            value={learned && learnt.leave != null}
            disabled={learnt.leave == null}
            onValueChange={setLearned}
            trackColor={{ false: palette.line, true: '#3F9F7F' }}
            thumbColor="#fff"
            accessibilityLabel="Use my real times"
          />
        </View>
      </Card>

      <Card style={styles.block}>
        <Text style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 17 }}>This week</Text>
        <View style={styles.pillars}>
          {(Object.keys(BASE) as Tag[]).map((tag) => (
            <View key={tag} style={styles.pillar}>
              <Ring size={70} stroke={7} pct={cnt(tag) / BASE[tag][1]} color={TAG_COLORS[tag]} track={palette.line}>
                <Text style={{ color: palette.ink, fontFamily: FONT.mono, fontSize: 12.5 }}>{`${cnt(tag)}/${BASE[tag][1]}`}</Text>
              </Ring>
              <Text style={{ color: palette.ink, fontFamily: FONT.bodySemi, fontSize: 12.5 }}>{TAG_META[tag].label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Pressable accessibilityRole="button" accessibilityLabel="Edit your weekly reward" onPress={() => setEditing(true)}>
        <Card style={styles.block}>
          <View style={styles.inline}>
            <Ionicons name="gift-outline" size={24} color={palette.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 17 }}>{`${reward.name}, your reward`}</Text>
              <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13, marginTop: 2 }}>
                {xp >= reward.goal ? 'You earned it. Enjoy it.' : `${reward.goal - xp} XP to go · tap to change`}
              </Text>
            </View>
            <Ionicons name="create-outline" size={18} color={palette.mute} />
          </View>
          <View style={[styles.bar, { backgroundColor: palette.line }]}>
            <View style={{ width: `${Math.min(100, (xp / reward.goal) * 100)}%`, height: '100%', backgroundColor: palette.accent, borderRadius: 10 }} />
          </View>
        </Card>
      </Pressable>

      <CheersCard />

      <SectionTitle>Proof wall</SectionTitle>
      {proofs.length ? (
        <View style={styles.shots}>
          {proofs.map((d) => (
            <Pressable
              key={d.id}
              style={styles.shot}
              accessibilityLabel={`Proof: ${d.title}${d.shared ? '. On the public wall. Long press to remove.' : ''}`}
              onLongPress={() => {
                if (!d.shared) return;
                Alert.alert('Remove from the wall?', 'It leaves the public page within a minute. Your photo stays on this phone.', [
                  { text: 'Keep', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                      await removeFromWall(d.id).catch(() => undefined);
                      useApp.getState().unshareDone(d.id);
                    },
                  },
                ]);
              }}
            >
              <Image source={{ uri: d.proofUri }} style={styles.shotImg} />
              {d.shared ? (
                <View style={[styles.badge, { backgroundColor: palette.accent }]}>
                  <Text style={{ color: palette.onAccent, fontFamily: FONT.bodyBold, fontSize: 9.5 }}>ON WALL</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 19, marginLeft: 4 }}>
          Photos you upload live here. Finish a task to put the first one up.
        </Text>
      )}

      {history.length ? (
        <View style={{ marginTop: 18 }}>
          <SectionTitle>XP history</SectionTitle>
          <Card style={{ gap: 10 }}>
            {history.map((d) => (
              <View key={d.id} style={styles.hist}>
                <Text numberOfLines={1} style={{ flex: 1, color: palette.ink, fontFamily: FONT.body, fontSize: 14 }}>{d.title}</Text>
                <Text style={{ color: palette.mute, fontFamily: FONT.mono, fontSize: 12 }}>{d.date.slice(5)}</Text>
                <Text style={{ color: '#3F9F7F', fontFamily: FONT.mono, fontSize: 13, width: 48, textAlign: 'right' }}>{`+${d.xp}`}</Text>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <RewardEditor visible={editing} onClose={() => setEditing(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  addGoal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 12 },
  h1: { fontSize: 29, letterSpacing: -0.7, marginBottom: 4 },
  sub: { fontSize: 14.5, lineHeight: 20, marginBottom: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 18, marginBottom: 12, borderRadius: 26 },
  block: { padding: 18, marginBottom: 12, borderRadius: 26, gap: 14 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  week: { flexDirection: 'row', gap: 7 },
  dayCol: { flex: 1, alignItems: 'center', gap: 6 },
  dayDot: { width: '100%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pillars: { flexDirection: 'row', justifyContent: 'space-around' },
  pillar: { alignItems: 'center', gap: 8 },
  bar: { height: 10, borderRadius: 10, overflow: 'hidden' },
  shots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shot: { width: '31.5%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden' },
  shotImg: { width: '100%', height: '100%' },
  badge: { position: 'absolute', left: 6, bottom: 6, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  hist: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backdrop: { flex: 1, backgroundColor: 'rgba(14,16,40,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFAF4', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingTop: 10 },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 5, backgroundColor: 'rgba(42,27,51,0.18)', marginBottom: 14 },
  h2: { fontFamily: FONT.displayBold, fontSize: 24, color: INK, letterSpacing: -0.5 },
  subtle: { fontFamily: FONT.body, fontSize: 14, color: MUTE, marginTop: 4, marginBottom: 16 },
  input: { height: 54, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(42,27,51,0.12)', backgroundColor: '#fff', paddingHorizontal: 16, fontFamily: FONT.bodySemi, fontSize: 17, color: INK },
  lab: { fontFamily: FONT.bodySemi, fontSize: 11.5, letterSpacing: 1.3, color: MUTE, marginTop: 18, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 12, backgroundColor: SOFT, justifyContent: 'center' },
});
