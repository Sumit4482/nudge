import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Motes } from '@/components/Motes';
import { PrimaryButton } from '@/components/ui';
import { usePlan } from '@/hooks/usePlan';
import { XP_PER_LEVEL } from '@/rewards';
import { useApp } from '@/store/useApp';
import { EASE, FONT } from '@/theme';

const INK = '#2A1B33';
const MUTE = '#7C6B72';
const SOFT = '#F6EBE0';
const ACCENT = '#CB6747';
const ease = Easing.bezier(...EASE);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The calm reward moment: a check that draws itself, XP counting up, soft pills, floating motes. */
export default function Reward() {
  const r = useApp((s) => s.lastReward);
  const clear = useApp((s) => s.clearReward);
  const plan = usePlan();
  const reduced = useReducedMotion();
  const next = plan.placed.find((b) => !b.pred);

  const card = useSharedValue(reduced ? 1 : 0);
  const check = useSharedValue(reduced ? 1 : 0);
  const bar = useSharedValue(reduced ? 1 : 0);
  const [xp, setXp] = useState(0);

  const total = r ? r.base + r.bonus : 0;
  const pct = r ? (r.newXp % XP_PER_LEVEL) / XP_PER_LEVEL : 0;

  useEffect(() => {
    if (!r) {
      router.back();
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (reduced) return;
    card.set(withTiming(1, { duration: 700, easing: ease }));
    check.set(withDelay(350, withTiming(1, { duration: 600, easing: ease })));
    bar.set(withDelay(500, withTiming(1, { duration: 1200, easing: ease })));
    const t0 = Date.now();
    const id = setInterval(() => {
      const k = Math.min(1, (Date.now() - t0) / 1100);
      setXp(Math.round(total * (1 - Math.pow(1 - k, 3))));
      if (k >= 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [r, reduced, total, card, check, bar]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: card.get(),
    transform: [{ translateY: (1 - card.get()) * 40 }, { scale: 0.85 + card.get() * 0.15 }],
  }));
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: 30 * (1 - check.get()) }));
  const barStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: bar.get() * pct }] }));

  if (!r) return null;
  const shownXp = reduced ? total : xp;

  const close = () => {
    clear();
    router.back();
  };

  const pills: { icon: keyof typeof Ionicons.glyphMap; text: string; gold?: boolean }[] = [];
  if (r.streakUp) pills.push({ icon: 'flame-outline', text: `Day ${r.streak} streak` });
  if (r.bonus) pills.push({ icon: 'gift-outline', text: `Bonus drop +${r.bonus}`, gold: true });
  if (r.levelUp) pills.push({ icon: 'trophy-outline', text: `Level ${r.level}`, gold: true });
  for (const e of r.extras) pills.push({ icon: e.icon as keyof typeof Ionicons.glyphMap, text: e.text, gold: e.gold });

  return (
    <View style={styles.backdrop}>
      {reduced ? null : <Motes />}
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={styles.badge}>
          <Svg width={46} height={46} viewBox="0 0 24 24" fill="none">
            <AnimatedPath
              d="M5 12.5l4.5 4.5L19 7"
              stroke="#fff"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="30"
              animatedProps={checkProps}
            />
          </Svg>
        </View>
        <Text style={styles.h2}>Done.</Text>
        <Text style={styles.sub}>{r.praise}</Text>
        <Text style={styles.xp}>
          {shownXp}
          <Text style={styles.xpUnit}> XP</Text>
        </Text>

        <View style={styles.pills}>
          {pills.map((p, i) => (
            <Animated.View
              key={p.text}
              entering={ZoomIn.delay(1100 + i * 300).duration(600).easing(ease)}
              style={[styles.pill, p.gold && { backgroundColor: '#F8E4B0' }]}
            >
              <Ionicons name={p.icon} size={16} color={ACCENT} />
              <Text style={styles.pillText}>{p.text}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeIn.delay(500).duration(500)} style={styles.barWrap}>
          <View style={styles.bar}>
            <Animated.View style={[styles.barFill, barStyle]} />
          </View>
          <Text style={styles.barText}>{`Level ${r.level}`}</Text>
        </Animated.View>

        <PrimaryButton
          label={next ? `Next: ${next.t.title}` : 'Back to my day'}
          onPress={close}
          style={{ backgroundColor: ACCENT, alignSelf: 'stretch', marginTop: 8 }}
        />
        <Pressable accessibilityRole="button" onPress={close} style={{ marginTop: 10, padding: 6 }}>
          <Text style={{ fontFamily: FONT.bodySemi, fontSize: 13, color: MUTE }}>Close</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(14,16,40,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: '#FFFAF4', borderRadius: 36, padding: 24, paddingTop: 28, alignItems: 'center', gap: 6 },
  badge: { width: 96, height: 96, borderRadius: 48, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  h2: { fontFamily: FONT.displayBold, fontSize: 32, color: INK, letterSpacing: -0.9, marginTop: 8 },
  sub: { fontFamily: FONT.body, fontSize: 14.5, color: MUTE, textAlign: 'center', lineHeight: 20, maxWidth: 270 },
  xp: { fontFamily: FONT.mono, fontSize: 46, color: ACCENT, letterSpacing: -2, marginTop: 6 },
  xpUnit: { fontSize: 16, color: MUTE, letterSpacing: 0 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', minHeight: 36 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 13, borderRadius: 99, backgroundColor: SOFT },
  pillText: { fontFamily: FONT.bodySemi, fontSize: 13, color: INK },
  barWrap: { alignSelf: 'stretch', gap: 6, marginTop: 8 },
  bar: { height: 8, borderRadius: 8, backgroundColor: '#F0E2D5', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 8, backgroundColor: ACCENT, transformOrigin: 'left center' },
  barText: { fontFamily: FONT.mono, fontSize: 12, color: MUTE, textAlign: 'right' },
});
