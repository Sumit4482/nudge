import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { EASE } from '@/theme/palettes';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const ease = Easing.bezier(...EASE);

interface Props {
  size: number;
  stroke: number;
  /** 0 to 1 */
  pct: number;
  color: string;
  track: string;
  children?: ReactNode;
}

/** A progress ring that starts at the top and eases to its value. */
export function Ring({ size, stroke, pct, color, track, children }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const target = Math.max(0, Math.min(1, pct));
  const reduced = useReducedMotion();
  const p = useSharedValue(0);

  useEffect(() => {
    p.set(reduced ? target : withTiming(target, { duration: 1100, easing: ease }));
  }, [target, reduced, p]);

  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.get()) }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          animatedProps={props}
        />
      </Svg>
      {children}
    </View>
  );
}
