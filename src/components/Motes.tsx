import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const COLORS = ['#F8D9B8', '#F6C9C0', '#CFE3F3', '#D8EBDD', '#FFF4DA', '#F3D78F'];
/** Stable pseudo-random number from an index, 0 to 1. */
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function Mote({ i, cx, cy }: { i: number; cx: number; cy: number }) {
  const t = useSharedValue(0);
  const dur = 3200 + rnd(i, 1) * 1400;
  const size = 4 + rnd(i, 2) * 7;
  const x0 = cx + (rnd(i, 3) - 0.5) * 220;
  const y0 = cy + (rnd(i, 4) - 0.2) * 120;
  const rise = 120 + rnd(i, 5) * 220;
  const amp = 8 + rnd(i, 6) * 22;
  const phase = rnd(i, 7) * 6;
  useEffect(() => {
    t.set(withDelay(rnd(i, 8) * 500, withTiming(1, { duration: dur, easing: Easing.out(Easing.quad) })));
  }, [t, dur, i]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.sin(Math.min(1, t.get() * 1.15) * Math.PI) * 0.9,
    transform: [{ translateX: Math.sin(t.get() * 6 + phase) * amp }, { translateY: -t.get() * rise }],
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', left: x0, top: y0, width: size, height: size, borderRadius: size / 2, backgroundColor: COLORS[i % COLORS.length] },
        style,
      ]}
    />
  );
}

/** Soft glow specks that drift up and fade over about four seconds. Calm, not confetti. */
export function Motes({ count = 60 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }, (_, i) => (
        <Mote key={i} i={i} cx={width / 2} cy={height * 0.55} />
      ))}
    </View>
  );
}
