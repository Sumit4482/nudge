import { useEffect, type ReactNode } from 'react';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { FLOWER_COLORS, gardenStage, MAX_POTS, STAGE_NAMES, unlockedPots } from '@/garden';

const LEAF = '#7DB58F';
const STEM = '#6FA383';

function Pot({ cx }: { cx: number }) {
  return (
    <>
      <Path d={`M${cx - 15} 120h30l-4 20h-22z`} fill="#C98A6B" />
      <Rect x={cx - 18} y={113} width={36} height={9} rx={3} fill="#D9A184" />
    </>
  );
}

function Leaf({ x, y, r }: { x: number; y: number; r: number }) {
  return <Ellipse cx={x} cy={y} rx={9} ry={4.5} fill={LEAF} transform={`rotate(${r} ${x} ${y})`} />;
}

function Plant({ cx, stage, color }: { cx: number; stage: number; color: string }) {
  const y = 112;
  const stem = (h: number) => <Path d={`M${cx} ${y} v-${h}`} stroke={STEM} strokeWidth={3} strokeLinecap="round" fill="none" />;
  if (stage === 0)
    return (
      <>
        <Ellipse cx={cx} cy={y - 2} rx={10} ry={4} fill="#9A7B60" />
        <Circle cx={cx} cy={y - 5} r={2.5} fill="#6E533D" />
      </>
    );
  if (stage === 1)
    return (
      <>
        {stem(24)}
        <Leaf x={cx - 8} y={y - 24} r={-30} />
        <Leaf x={cx + 8} y={y - 27} r={30} />
      </>
    );
  if (stage === 2)
    return (
      <>
        {stem(44)}
        <Leaf x={cx - 9} y={y - 16} r={-25} />
        <Leaf x={cx + 9} y={y - 25} r={25} />
        <Leaf x={cx - 9} y={y - 34} r={-25} />
        <Leaf x={cx + 9} y={y - 43} r={25} />
      </>
    );
  if (stage === 3) {
    const fy = y - 62;
    return (
      <>
        {stem(56)}
        <Leaf x={cx - 9} y={y - 18} r={-25} />
        <Leaf x={cx + 9} y={y - 30} r={25} />
        <Leaf x={cx - 9} y={y - 40} r={-25} />
        {[0, 72, 144, 216, 288].map((a) => (
          <Ellipse key={a} cx={cx} cy={fy - 8} rx={5} ry={8} fill={color} transform={`rotate(${a} ${cx} ${fy})`} />
        ))}
        <Circle cx={cx} cy={fy} r={4.5} fill="#F7D774" />
      </>
    );
  }
  return (
    <>
      <Rect x={cx - 4} y={y - 48} width={8} height={48} rx={3} fill="#9A7B60" />
      <Circle cx={cx} cy={y - 62} r={20} fill={LEAF} />
      <Circle cx={cx - 14} cy={y - 50} r={13} fill="#8CC29F" />
      <Circle cx={cx + 14} cy={y - 50} r={13} fill={STEM} />
      <Circle cx={cx - 6} cy={y - 68} r={3.5} fill={color} />
      <Circle cx={cx + 9} cy={y - 58} r={3.5} fill={color} />
      <Circle cx={cx - 16} cy={y - 50} r={3} fill={color} />
    </>
  );
}

/** The garden grows in softly, then sways very slowly. */
function Swaying({ children, index }: { children: ReactNode; index: number }) {
  const reduced = useReducedMotion();
  const grow = useSharedValue(reduced ? 1 : 0.5);
  const sway = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    grow.set(withDelay(index * 140, withTiming(1, { duration: 1800, easing: Easing.bezier(0.22, 0.8, 0.3, 1) })));
    sway.set(withDelay(index * 500, withRepeat(withSequence(withTiming(1, { duration: 3500 }), withTiming(-1, { duration: 3500 })), -1, true)));
  }, [reduced, index, grow, sway]);
  const style = useAnimatedStyle(() => ({
    opacity: grow.get() < 1 ? 0.4 + (grow.get() - 0.5) * 1.2 : 1,
    transform: [{ scale: grow.get() }, { rotate: `${sway.get() * 1.6}deg` }],
  }));
  return <Animated.View style={[{ transformOrigin: 'center bottom' }, style]}>{children}</Animated.View>;
}

/** The garden: up to five pots. Level unlocks pots. The streak sets the stage of every plant. */
export function Garden({ streak, level, ink }: { streak: number; level: number; ink: string }) {
  const stage = gardenStage(streak);
  const pots = unlockedPots(level);
  const W = 340;
  const H = 150;
  return (
    <Swaying index={0}>
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={150} accessibilityLabel={`Garden: ${pots} plants, ${STAGE_NAMES[stage]}`}>
      <Rect x={0} y={138} width={W} height={12} rx={6} fill={ink} opacity={0.08} />
      {Array.from({ length: MAX_POTS }, (_, i) => {
        const cx = 34 + i * 68;
        const on = i < pots;
        return (
          <G key={i} opacity={on ? 1 : 0.3}>
            <Pot cx={cx} />
            {on ? (
              <Plant cx={cx} stage={stage} color={FLOWER_COLORS[i]} />
            ) : (
              <SvgText x={cx} y={100} textAnchor="middle" fontSize={11} fill={ink}>{`Lv ${i + 1}`}</SvgText>
            )}
          </G>
        );
      })}
    </Svg>
    </Swaying>
  );
}
