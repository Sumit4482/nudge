import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/** A slow ring that grows and fades behind a circle, about every 3.4 seconds. */
export function Pulse({ color, size }: { color: string; size: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    t.set(withRepeat(withTiming(1, { duration: 3400, easing: Easing.out(Easing.quad) }), -1, false));
  }, [reduced, t]);
  const style = useAnimatedStyle(() => ({ opacity: 0.4 * (1 - t.get()), transform: [{ scale: 1 + t.get() * 0.5 }] }));
  if (reduced) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]}
    />
  );
}
