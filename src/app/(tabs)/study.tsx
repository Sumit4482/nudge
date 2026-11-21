import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, PrimaryButton, SectionTitle } from '@/components/ui';
import { Screen } from '@/components/Screen';
import { useNow } from '@/hooks/useNow';
import { addDays, daysBetween, shortDate } from '@/lib/dates';
import { useApp } from '@/store/useApp';
import { backPlan, STATUS_LABEL } from '@/study/logic';
import { FONT, usePhase } from '@/theme';

export default function Study() {
  const { palette } = usePhase();
  const { date } = useNow();
  const study = useApp((s) => s.study);
  const tasks = useApp((s) => s.tasks);
  const cycle = useApp((s) => s.cycleChapter);

  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(date, -i)), [date]);
  const minutes = study.subjects.map((name) => ({ name, mins: week.reduce((sum, d) => sum + (study.minutes[name]?.[d] ?? 0), 0) }));
  const top = Math.max(1, ...minutes.map((m) => m.mins));
  const reviews = tasks.filter((t) => t.review && !t.done).sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));

  return (
    <Screen>
      <Text style={{ color: palette.hero, fontFamily: FONT.display, fontSize: 29, letterSpacing: -0.7, marginBottom: 4 }}>Study</Text>
      <Text style={{ color: palette.heroMute, fontFamily: FONT.body, fontSize: 14.5, lineHeight: 20, marginBottom: 12 }}>Exams, chapters and where your focus time goes.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Edit subjects and topics" onPress={() => router.push('/edit-study')} style={[styles.editBtn, { backgroundColor: palette.card }]}>
        <Ionicons name="create-outline" size={16} color={palette.ink} />
        <Text style={{ color: palette.ink, fontFamily: FONT.bodySemi, fontSize: 13.5 }}>Edit subjects, topics and dates</Text>
      </Pressable>

      {study.exams.map((x) => {
        const chapters = study.chapters[x.subject] ?? [];
        const left = chapters.filter((c) => c.s < 2).length;
        const days = daysBetween(date, x.date);
        const plan = backPlan(left, days);
        return (
          <Card key={x.subject} style={styles.exam}>
            <View style={{ alignItems: 'center', minWidth: 60 }}>
              <Text style={{ color: palette.accent, fontFamily: FONT.displayBold, fontSize: 40, lineHeight: 42, letterSpacing: -1 }}>{Math.max(0, days)}</Text>
              <Text style={{ color: palette.mute, fontFamily: FONT.bodySemi, fontSize: 10.5, letterSpacing: 1 }}>DAYS</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              <Text style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 17 }}>{`${x.subject} exam · ${shortDate(x.date)}`}</Text>
              <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 17 }}>{plan.text}</Text>
              <View style={[styles.bar, { backgroundColor: palette.line }]}>
                <View style={{ width: `${chapters.length ? ((chapters.length - left) / chapters.length) * 100 : 0}%`, height: '100%', backgroundColor: palette.accent, borderRadius: 8 }} />
              </View>
            </View>
          </Card>
        );
      })}

      <SectionTitle>Subjects and syllabus</SectionTitle>
      {Object.entries(study.chapters).map(([subject, chapters]) => (
        <Card key={subject} style={styles.block}>
          <View style={styles.inline}>
            <Ionicons name="book-outline" size={18} color={palette.ink} />
            <Text style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 17 }}>{subject}</Text>
          </View>
          <View style={styles.wrap}>
            {chapters.map((c, i) => (
              <Pressable
                key={c.name}
                accessibilityRole="button"
                accessibilityLabel={`${c.name}, ${STATUS_LABEL[c.s]}. Tap to change.`}
                onPress={() => cycle(subject, i)}
                style={[styles.chapter, { backgroundColor: c.s === 2 ? '#3F9F7F40' : c.s === 1 ? `${palette.accent}33` : palette.line }]}
              >
                <Text style={{ color: palette.ink, fontFamily: FONT.bodySemi, fontSize: 13 }}>{c.name}</Text>
                <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 10.5 }}>{STATUS_LABEL[c.s]}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ))}

      <SectionTitle>Focus minutes this week</SectionTitle>
      <Card style={styles.block}>
        {minutes.map((m) => (
          <View key={m.name} style={styles.mrow}>
            <Text style={{ width: 78, color: palette.ink, fontFamily: FONT.bodySemi, fontSize: 13.5 }}>{m.name}</Text>
            <View style={[styles.bar, { flex: 1, backgroundColor: palette.line }]}>
              <View style={{ width: `${(m.mins / top) * 100}%`, height: '100%', backgroundColor: palette.accent, borderRadius: 8 }} />
            </View>
            <Text style={{ color: palette.ink, fontFamily: FONT.mono, fontSize: 12.5, width: 48, textAlign: 'right' }}>{`${m.mins}m`}</Text>
          </View>
        ))}
        <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5 }}>Finished study tasks and Pomodoro runs add here.</Text>
      </Card>

      <SectionTitle>Spaced reviews</SectionTitle>
      <Card style={styles.block}>
        {reviews.length ? (
          reviews.map((r) => {
            const n = daysBetween(date, r.dueDate ?? date);
            return (
              <View key={r.id} style={styles.mrow}>
                <Text numberOfLines={1} style={{ flex: 1, color: palette.ink, fontFamily: FONT.body, fontSize: 14 }}>{r.title}</Text>
                <Text style={{ color: palette.accent, fontFamily: FONT.mono, fontSize: 12.5 }}>{n <= 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`}</Text>
              </View>
            );
          })
        ) : (
          <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 19 }}>Finish a chapter and reviews appear at +1, +3 and +7 days.</Text>
        )}
      </Card>

      <Card style={styles.block}>
        <View style={styles.inline}>
          <Ionicons name="mic-outline" size={18} color={palette.ink} />
          <Text style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 17 }}>Teach it back</Text>
        </View>
        <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 19 }}>
          Explain a chapter out loud for 20 to 60 seconds. It counts as proof for study tasks.
        </Text>
        <PrimaryButton label="Try it now" icon="mic-outline" onPress={() => router.push({ pathname: '/proof', params: { teach: '1', subject: study.subjects[0] ?? 'a chapter' } })} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', height: 38, paddingHorizontal: 14, borderRadius: 13, marginBottom: 16 },
  exam: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, marginBottom: 12, borderRadius: 24 },
  block: { padding: 16, gap: 12, marginBottom: 12, borderRadius: 24 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chapter: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, gap: 1 },
  bar: { height: 8, borderRadius: 8, overflow: 'hidden' },
  mrow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
