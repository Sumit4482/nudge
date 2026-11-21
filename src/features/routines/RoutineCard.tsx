import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Card, TagIcon } from '@/components/ui';
import { DAY_SHORT } from '@/lib/date';
import { dur } from '@/planner';
import { useApp } from '@/store/useApp';
import { FONT, usePhase } from '@/theme';
import type { Task } from '@/types';

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function RoutineCard({ task, paused = false }: { task: Task; paused?: boolean }) {
  const { palette } = usePhase();
  const setOff = useApp((s) => s.setRoutineOff);
  const [open, setOpen] = useState(false);
  const days = task.days ?? [];
  const when = task.everyDays ? `Every ${task.everyDays} days` : days.length === 7 || !days.length ? 'Every day' : days.map((d) => DAY_SHORT[d]).join(', ');

  return (
    <Card style={{ marginBottom: 12, padding: 0, borderRadius: 24, opacity: task.off || paused ? 0.7 : 1 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${task.title}, ${open ? 'collapse' : 'expand'}`} onPress={() => setOpen((o) => !o)} style={styles.head}>
        <TagIcon tag={task.tag} />
        <View style={{ flex: 1, minWidth: 0, opacity: task.off || paused ? 0.55 : 1 }}>
          <Text numberOfLines={1} style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 15.5 }}>{task.title}</Text>
          <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5, marginTop: 2 }}>
            {paused ? 'Paused by rest mode' : `${when} · ${dur(task.mins)}`}
          </Text>
        </View>
        <Switch
          value={!task.off && !paused}
          disabled={paused}
          onValueChange={(on) => setOff(task.id, !on)}
          trackColor={{ false: palette.line, true: '#3F9F7F' }}
          thumbColor="#fff"
          accessibilityLabel={`${task.title} on or off`}
        />
      </Pressable>
      {open ? (
        <View style={styles.body}>
          {(task.steps ?? []).map((s, i) => (
            <View key={s} style={styles.step}>
              <View style={[styles.num, { borderColor: palette.line }]}>
                <Text style={{ color: palette.mute, fontFamily: FONT.mono, fontSize: 11 }}>{i + 1}</Text>
              </View>
              <Text style={{ color: palette.ink, fontFamily: FONT.body, fontSize: 13.5, flex: 1 }}>{s}</Text>
            </View>
          ))}
          {task.everyDays ? (
            <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5 }}>
              {task.lastDone ? `Last done ${task.lastDone}. Due again ${task.everyDays} days after.` : 'Not done yet, so it is due now.'}
            </Text>
          ) : (
            <View style={styles.days}>
              {LETTERS.map((l, d) => {
                const on = !days.length || days.includes(d);
                return (
                  <View key={d} style={[styles.day, { backgroundColor: on ? palette.accent : palette.line }]}>
                    <Text style={{ color: on ? palette.onAccent : palette.mute, fontFamily: FONT.mono, fontSize: 12 }}>{l}</Text>
                  </View>
                );
              })}
            </View>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${task.title}`} onPress={() => router.push({ pathname: '/edit-task', params: { id: task.id } })} style={[styles.edit, { backgroundColor: palette.line }]}>
            <Ionicons name="create-outline" size={15} color={palette.ink} />
            <Text style={{ color: palette.ink, fontFamily: FONT.bodySemi, fontSize: 13 }}>Edit routine</Text>
          </Pressable>
          <View style={styles.streak}>
            <Ionicons name="flame-outline" size={14} color={palette.mute} />
            <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5 }}>Weeks in a row appear after your first week.</Text>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 12 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  num: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  days: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', height: 34, paddingHorizontal: 12, borderRadius: 11 },
});
