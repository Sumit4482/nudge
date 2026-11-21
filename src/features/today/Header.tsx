import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Pill } from '@/components/ui';
import { Ring } from '@/components/Ring';
import { DAY_SHORT } from '@/lib/date';
import { greeting } from '@/lib/copy';
import { dueToday, fmt, isFreeDay } from '@/planner';
import { useApp } from '@/store/useApp';
import { FONT, usePhase } from '@/theme';
import type { PlanOutput } from '@/types';

export function Header({ plan, now, dow }: { plan: PlanOutput; now: number; dow: number }) {
  const { palette, phase } = usePhase();
  const rest = useApp((s) => s.rest);
  const tasks = useApp((s) => s.tasks);
  const doneToday = useApp((s) => s.done.filter((d) => d.date === s.date).length);

  const freeDay = isFreeDay(dow, rest !== 'normal');
  const k = plan.placed.length;
  const mins = plan.placed.reduce((sum, b) => sum + b.t.mins, 0);
  const [h1, sub] = greeting({ phase, freeDay, rest, count: k, mins, left: dueToday(tasks, dow).length });
  const goal = doneToday + k;

  // The ring pops once, softly, each time a task is finished.
  const reduced = useReducedMotion();
  const pop = useSharedValue(1);
  const prev = useRef(doneToday);
  useEffect(() => {
    if (doneToday > prev.current && !reduced) pop.set(withSequence(withTiming(1.07, { duration: 350 }), withTiming(1, { duration: 650 })));
    prev.current = doneToday;
  }, [doneToday, reduced, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }));
  const phaseLabel =
    rest === 'travel' ? 'Travel' : rest === 'sick' ? 'Rest' : { dawn: freeDay ? 'Weekend' : 'Morning', day: freeDay ? 'Afternoon' : 'Office', dusk: 'Evening', night: 'Night' }[phase];

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        <Pill>{`${DAY_SHORT[dow]} ${fmt(now)}`}</Pill>
        <Pill>{phaseLabel}</Pill>
      </View>
      <View style={styles.main}>
        <View style={styles.text}>
          <Text style={[styles.h1, { color: palette.hero, fontFamily: FONT.display }]}>{h1}</Text>
        </View>
        <Animated.View style={popStyle}>
          <Ring size={84} stroke={7} pct={goal ? doneToday / goal : 0} color={palette.accent} track={palette.line}>
            <Text style={{ color: palette.hero, fontFamily: FONT.mono, fontSize: 15 }}>{`${doneToday}/${goal}`}</Text>
            <Text style={{ color: palette.heroMute, fontFamily: FONT.bodySemi, fontSize: 9.5, letterSpacing: 0.8 }}>DONE</Text>
          </Ring>
        </Animated.View>
      </View>
      <View style={styles.subRow}>
        <Ionicons name="time-outline" size={15} color={palette.heroMute} />
        <Text style={[styles.sub, { color: palette.heroMute, fontFamily: FONT.body }]}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginBottom: 16 },
  chips: { flexDirection: 'row', gap: 8 },
  main: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  text: { flex: 1 },
  h1: { fontSize: 29, lineHeight: 32, letterSpacing: -0.7 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sub: { fontSize: 14.5, lineHeight: 20, flex: 1 },
});
