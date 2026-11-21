import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { EASE, DURATION, PALETTES, usePhase } from '@/theme';
import type { Phase } from '@/theme';

const ORDER: Phase[] = ['dawn', 'day', 'dusk', 'night'];
const ease = Easing.bezier(...EASE);

/** Orb position as a fraction of the screen, and size in pixels. */
const ORB: Record<Phase, { x: number; y: number; s: number }> = {
  dawn: { x: 0.1, y: 0.2, s: 84 },
  day: { x: 0.46, y: 0.02, s: 84 },
  dusk: { x: 0.72, y: 0.34, s: 96 },
  night: { x: 0.52, y: 0.02, s: 58 },
};
const ORB_COLORS = ['#F8C99A', '#FBEBA8', '#F5A98C', '#EDE8F5'];
const HALO_COLORS = ['rgba(255,190,140,0.35)', 'rgba(255,244,190,0.45)', 'rgba(245,150,140,0.32)', 'rgba(190,205,255,0.18)'];

const STARS = [
  [0.08, 0.05], [0.22, 0.12], [0.4, 0.04], [0.58, 0.1], [0.86, 0.16], [0.92, 0.04],
  [0.3, 0.2], [0.66, 0.18], [0.14, 0.26], [0.5, 0.3],
] as const;

function Layer({ phase, active, reduced }: { phase: Phase; active: boolean; reduced: boolean }) {
  const o = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    o.set(reduced ? (active ? 1 : 0) : withTiming(active ? 1 : 0, { duration: DURATION.sky, easing: ease }));
  }, [active, reduced, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.get() }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <LinearGradient colors={PALETTES[phase].sky} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

function Cloud({ top, w, duration, delay, night }: { top: number; w: number; duration: number; delay: number; night: boolean }) {
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const x = useSharedValue(-w - 20);
  useEffect(() => {
    if (reduced) {
      x.set(width * 0.2);
      return;
    }
    x.set(withRepeat(withTiming(width + 20, { duration, easing: Easing.linear }), -1, false));
  }, [reduced, width, duration, x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }], opacity: night ? 0.1 : 0.5 }));
  void delay;
  return <Animated.View pointerEvents="none" style={[styles.cloud, { top, width: w }, style]} />;
}

/** The whole-screen sky. Cross-fades between the four looks, moves the sun and moon, shows stars at night. */
export function Sky() {
  const { phase } = usePhase();
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const idx = ORDER.indexOf(phase);
  const night = phase === 'night';

  const progress = useSharedValue(idx);
  const px = useSharedValue(ORB[phase].x);
  const py = useSharedValue(ORB[phase].y);
  const ps = useSharedValue(ORB[phase].s);
  const stars = useSharedValue(night ? 0.9 : 0);

  useEffect(() => {
    const o = ORB[phase];
    const go = (v: number, d: number) => (reduced ? v : withTiming(v, { duration: d, easing: ease }));
    progress.set(go(idx, DURATION.color));
    px.set(go(o.x, DURATION.orb));
    py.set(go(o.y, DURATION.orb));
    ps.set(go(o.s, DURATION.orb));
    stars.set(go(night ? 0.9 : 0, DURATION.sky));
  }, [phase, idx, night, reduced, progress, px, py, ps, stars]);

  const orb = useAnimatedStyle(() => {
    const s = ps.get();
    return {
      left: px.get() * width,
      top: py.get() * height,
      width: s,
      height: s,
      borderRadius: s / 2,
      backgroundColor: interpolateColor(progress.get(), [0, 1, 2, 3], ORB_COLORS),
    };
  });
  const halo = useAnimatedStyle(() => {
    const s = ps.get() * 2.4;
    return {
      left: px.get() * width - (s - ps.get()) / 2,
      top: py.get() * height - (s - ps.get()) / 2,
      width: s,
      height: s,
      borderRadius: s / 2,
      backgroundColor: interpolateColor(progress.get(), [0, 1, 2, 3], HALO_COLORS),
    };
  });
  const starStyle = useAnimatedStyle(() => ({ opacity: stars.get() }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {ORDER.map((p) => (
        <Layer key={p} phase={p} active={p === phase} reduced={reduced} />
      ))}
      <Animated.View style={[StyleSheet.absoluteFill, starStyle]}>
        {STARS.map(([sx, sy], i) => (
          <View key={i} style={[styles.star, { left: sx * width, top: sy * height }]} />
        ))}
      </Animated.View>
      <Cloud top={height * 0.18} w={140} duration={70000} delay={0} night={night} />
      <Cloud top={height * 0.34} w={190} duration={100000} delay={0} night={night} />
      <Animated.View style={[styles.abs, halo]} />
      <Animated.View style={[styles.abs, orb]} />
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  star: { position: 'absolute', width: 2.5, height: 2.5, borderRadius: 2, backgroundColor: '#fff' },
  cloud: { position: 'absolute', height: 36, borderRadius: 40, backgroundColor: '#fff' },
});
