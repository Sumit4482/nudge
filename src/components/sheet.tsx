import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FONT } from '@/theme';
import type { IconName } from './tagMeta';

/** Fixed warm colors so sheets read the same in every sky. */
export const SHEET = { ink: '#2A1B33', mute: '#7C6B72', soft: '#F6EBE0', accent: '#CB6747', line: 'rgba(42,27,51,0.12)' } as const;

/** A bottom sheet on a dimmed backdrop. Tapping the backdrop goes back. */
export function Sheet({ children, onClose = () => router.back() }: { children: ReactNode; onClose?: () => void }) {
  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <View style={styles.sheet}>
          <View style={styles.grab} />
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export function SheetTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={styles.h2}>{title}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

export function SheetLabel({ children }: { children: string }) {
  return <Text style={styles.lab}>{children.toUpperCase()}</Text>;
}

export function SheetOption({ icon, label, sub, onPress }: { icon?: IconName; label: string; sub?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.opt, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      {icon ? <Ionicons name={icon} size={20} color={SHEET.ink} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.optLabel}>{label}</Text>
        {sub ? <Text style={styles.optSub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

export function SheetButton({
  label,
  icon,
  onPress,
  primary,
  disabled,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: primary ? SHEET.accent : SHEET.soft, opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      {icon ? <Ionicons name={icon} size={20} color={primary ? '#fff' : SHEET.ink} /> : null}
      <Text style={[styles.btnText, { color: primary ? '#fff' : SHEET.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(14,16,40,0.5)', justifyContent: 'flex-end' },
  wrap: { maxHeight: '92%' },
  sheet: { backgroundColor: '#FFFAF4', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingTop: 10, flexShrink: 1 },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 5, backgroundColor: 'rgba(42,27,51,0.18)', marginBottom: 14 },
  h2: { fontFamily: FONT.displayBold, fontSize: 24, color: SHEET.ink, letterSpacing: -0.5, lineHeight: 28 },
  sub: { fontFamily: FONT.body, fontSize: 14, color: SHEET.mute, marginTop: 4, lineHeight: 20 },
  lab: { fontFamily: FONT.bodySemi, fontSize: 11.5, letterSpacing: 1.3, color: SHEET.mute, marginTop: 18, marginBottom: 8 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: SHEET.soft, borderRadius: 18, padding: 14, marginTop: 10 },
  optLabel: { fontFamily: FONT.bodySemi, fontSize: 15, color: SHEET.ink },
  optSub: { fontFamily: FONT.body, fontSize: 12.5, color: SHEET.mute, marginTop: 1 },
  btn: { height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 10 },
  btnText: { fontFamily: FONT.display, fontSize: 16 },
});
