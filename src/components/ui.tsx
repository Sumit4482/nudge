import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { FONT, TAG_COLORS, usePhase } from '@/theme';
import type { Tag } from '@/types';
import { TAG_META, type IconName } from './tagMeta';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { palette } = usePhase();
  return <View style={[styles.card, { backgroundColor: palette.card }, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: string }) {
  const { palette } = usePhase();
  return <Text style={[styles.section, { color: palette.heroMute, fontFamily: FONT.bodySemi }]}>{children.toUpperCase()}</Text>;
}

export function Pill({ children, style, icon }: { children: ReactNode; style?: StyleProp<ViewStyle>; icon?: IconName }) {
  const { palette } = usePhase();
  return (
    <View style={[styles.pill, { backgroundColor: palette.card }, style]}>
      {icon ? <Ionicons name={icon} size={14} color={palette.ink} /> : null}
      <Text style={{ color: palette.ink, fontFamily: FONT.mono, fontSize: 12.5 }}>{children}</Text>
    </View>
  );
}

export function TagIcon({ tag, size = 36 }: { tag: Tag; size?: number }) {
  const c = TAG_COLORS[tag];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 3, backgroundColor: `${c}2B`, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={TAG_META[tag].icon} size={size * 0.5} color={c} />
    </View>
  );
}

export function PrimaryButton({
  label,
  icon,
  onPress,
  disabled,
  style,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette } = usePhase();
  const text: TextStyle = { color: palette.onAccent, fontFamily: FONT.display, fontSize: 16 };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.accent, opacity: disabled ? 0.4 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={20} color={palette.onAccent} /> : null}
      <Text style={text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 14 },
  section: { fontSize: 11.5, letterSpacing: 1.4, marginTop: 6, marginBottom: 10, marginLeft: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 11, borderRadius: 99 },
  button: { height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
});
