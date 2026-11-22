import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { Pulse } from '@/components/Pulse';
import { Card, PrimaryButton } from '@/components/ui';
import type { IconName } from '@/components/tagMeta';
import { tapAnchorWithFeedback } from '@/focus/anchors';
import { MY_TIMES } from '@/lib/times';
import { fmt, isFreeDay } from '@/planner';
import { planDefaults } from '@/store/selectors';
import { useApp } from '@/store/useApp';
import { EASE, FONT, usePhase } from '@/theme';
import type { AnchorKey } from '@/types';

const ease = Easing.bezier(...EASE);

/** The line between anchors fills smoothly as you tap them. */
function Fill({ fill, color }: { fill: number; color: string }) {
  const reduced = useReducedMotion();
  const f = useSharedValue(0);
  useEffect(() => {
    f.set(reduced ? fill : withTiming(fill, { duration: 1100, easing: ease }));
  }, [fill, reduced, f]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: f.get() }] }));
  return <Animated.View style={[{ width: '100%', height: '100%', backgroundColor: color, borderRadius: 3, transformOrigin: 'left center' }, style]} />;
}

const ALL: { key: AnchorKey; label: string; icon: IconName }[] = [
  { key: 'wake', label: 'Woke up', icon: 'sunny-outline' },
  { key: 'leave', label: 'Office', icon: 'briefcase-outline' },
  { key: 'home', label: 'Home', icon: 'home-outline' },
  { key: 'sleep', label: 'Sleep', icon: 'moon-outline' },
];

const BUTTON: Record<AnchorKey, { label: string; icon: IconName; hint: string }> = {
  wake: { label: 'I woke up', icon: 'sunny-outline', hint: 'Tap when you get up. The day starts from here.' },
  leave: { label: 'Leaving for office', icon: 'briefcase-outline', hint: 'Tap on your way out. Anything left for the morning moves to tonight.' },
  home: { label: "I'm home", icon: 'home-outline', hint: 'Tap when you walk in. Home early or late, tonight re-plans.' },
  sleep: { label: 'Going to sleep', icon: 'moon-outline', hint: 'Tap at bedtime. Unfinished tasks roll to tomorrow.' },
};

export function DayRail({ now, dow, date }: { now: number; dow: number; date: string }) {
  const { palette } = usePhase();
  const anchors = useApp((s) => s.anchors);
  const rest = useApp((s) => s.rest);
  const learned = useApp((s) => s.learned);
  const log = useApp((s) => s.anchorLog);
  const resetDay = useApp((s) => s.resetDay);

  const defaults = planDefaults(learned, log);
  const at = { wake: MY_TIMES.wake, leave: MY_TIMES.officeStart, home: defaults?.home ?? MY_TIMES.home, sleep: MY_TIMES.sleep };
  const free = isFreeDay(dow, rest !== 'normal');
  const nodes = free ? ALL.filter((n) => n.key === 'wake' || n.key === 'sleep') : ALL;
  const next = nodes.find((n) => anchors[n.key] == null)?.key;
  const doneCount = nodes.filter((n) => anchors[n.key] != null).length;
  const fill = nodes.length > 1 ? Math.max(0, (doneCount - 1) / (nodes.length - 1)) : 0;

  return (
    <Card style={styles.card}>
      <View style={styles.nodeWrap}>
        <View style={[styles.track, { backgroundColor: palette.line, left: `${50 / nodes.length}%`, right: `${50 / nodes.length}%` }]}>
          <Fill fill={fill} color={palette.accent} />
        </View>
        <View style={styles.nodes}>
          {nodes.map((n) => {
            const t = anchors[n.key];
            const isDone = t != null;
            const isNext = n.key === next;
            return (
              <Pressable
                key={n.key}
                accessibilityRole="button"
                accessibilityLabel={isDone ? `${n.label} at ${fmt(t)}. Tap to change or undo.` : `${n.label}. Tap to set the time.`}
                onPress={() => router.push({ pathname: '/edit-anchor', params: { key: n.key } })}
                style={styles.node}
              >
                <View style={styles.circleWrap}>
                  {isNext ? <Pulse color={palette.accent} size={40} /> : null}
                  <View
                    style={[
                      styles.circle,
                      { backgroundColor: isDone ? palette.accent : palette.sky[0], borderColor: isDone || isNext ? palette.accent : palette.line },
                    ]}
                  >
                    <Ionicons name={isDone ? 'checkmark' : n.icon} size={18} color={isDone ? palette.onAccent : isNext ? palette.accent : palette.mute} />
                  </View>
                </View>
                <Text style={{ color: palette.mute, fontFamily: FONT.bodySemi, fontSize: 11.5 }}>{n.label}</Text>
                <Text style={{ color: isDone ? palette.ink : palette.mute, fontFamily: FONT.mono, fontSize: 11.5 }}>
                  {isDone ? fmt(t) : `~${fmt(at[n.key])}`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {next ? (
        <PrimaryButton label={BUTTON[next].label} icon={BUTTON[next].icon} onPress={() => tapAnchorWithFeedback(next, now, dow, date)} />
      ) : (
        <PrimaryButton label="Start a new day (demo)" icon="repeat" onPress={resetDay} />
      )}
      <Text style={[styles.hint, { color: palette.mute, fontFamily: FONT.body }]}>{next ? `${BUTTON[next].hint}${doneCount ? ' Wrong time? Tap a step above to fix it.' : ''}` : 'Day closed. Rest well.'}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 14, marginBottom: 20, borderRadius: 26 },
  nodeWrap: { position: 'relative' },
  track: { position: 'absolute', top: 19, height: 3, borderRadius: 3, overflow: 'hidden' },
  nodes: { flexDirection: 'row' },
  node: { flex: 1, alignItems: 'center', gap: 5 },
  circleWrap: { width: 40, height: 40 },
  circle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 12.5, textAlign: 'center', lineHeight: 17 },
});
