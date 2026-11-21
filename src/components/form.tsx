import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { FONT } from '@/theme';
import { SHEET } from './sheet';

/** Small form pieces for the edit sheets. Colors match the other sheets. */

export function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.lab}>{children.toUpperCase()}</Text>;
}

export function TextField({
  value,
  onChange,
  placeholder,
  multiline,
  label,
  maxLength,
  keyboardType,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  label: string;
  maxLength?: number;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#B7A8AE"
      multiline={multiline}
      maxLength={maxLength}
      keyboardType={keyboardType}
      accessibilityLabel={label}
      style={[styles.input, multiline && styles.multi]}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  );
}

export function Chips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Pressable key={String(o.value)} accessibilityRole="button" accessibilityState={{ selected: o.value === value }} onPress={() => onChange(o.value)} style={[styles.chip, o.value === value && styles.chipOn]}>
          <Text style={[styles.chipText, o.value === value && { color: '#fff' }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 480,
  step = 5,
  format = (v: number) => String(v),
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  label: string;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: less`} onPress={() => set(value - step)} style={styles.stepBtn}>
        <Ionicons name="remove" size={20} color={SHEET.ink} />
      </Pressable>
      <Text style={styles.stepVal} accessibilityLabel={`${label}: ${format(value)}`}>
        {format(value)}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: more`} onPress={() => set(value + step)} style={styles.stepBtn}>
        <Ionicons name="add" size={20} color={SHEET.ink} />
      </Pressable>
    </View>
  );
}

export function SwitchRow({ label, sub, value, onChange, disabled }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.switchLabel}>{label}</Text>
        {sub ? <Text style={styles.small}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} trackColor={{ false: '#E4D8CF', true: '#3F9F7F' }} thumbColor="#fff" accessibilityLabel={label} />
    </View>
  );
}

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Seven day toggles. Monday first. */
export function DayPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const toggle = (d: number) => onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d].sort());
  return (
    <View style={styles.days}>
      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
        <Pressable key={d} accessibilityRole="button" accessibilityLabel={NAMES[d]} accessibilityState={{ selected: value.includes(d) }} onPress={() => toggle(d)} style={[styles.day, value.includes(d) && styles.chipOn]}>
          <Text style={[styles.dayText, value.includes(d) && { color: '#fff' }]}>{LETTERS[d]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function DangerButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.danger}>
      <Ionicons name="trash-outline" size={18} color="#B4443B" />
      <Text style={styles.dangerText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lab: { fontFamily: FONT.bodySemi, fontSize: 11.5, letterSpacing: 1.3, color: SHEET.mute, marginTop: 18, marginBottom: 8 },
  input: { minHeight: 50, borderRadius: 16, borderWidth: 2, borderColor: SHEET.line, backgroundColor: '#fff', paddingHorizontal: 14, fontFamily: FONT.bodySemi, fontSize: 16, color: SHEET.ink },
  multi: { minHeight: 140, paddingTop: 12, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 12, backgroundColor: SHEET.soft, justifyContent: 'center' },
  chipOn: { backgroundColor: SHEET.ink },
  chipText: { fontFamily: FONT.bodySemi, fontSize: 13.5, color: SHEET.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: SHEET.soft, alignItems: 'center', justifyContent: 'center' },
  stepVal: { minWidth: 86, textAlign: 'center', fontFamily: FONT.mono, fontSize: 17, color: SHEET.ink },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  switchLabel: { fontFamily: FONT.bodySemi, fontSize: 15, color: SHEET.ink },
  small: { fontFamily: FONT.body, fontSize: 12.5, color: SHEET.mute, marginTop: 1 },
  days: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, height: 42, borderRadius: 12, backgroundColor: SHEET.soft, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: FONT.mono, fontSize: 14, color: SHEET.ink },
  danger: { height: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 22, borderWidth: 1.5, borderColor: 'rgba(180,68,59,0.35)' },
  dangerText: { fontFamily: FONT.bodySemi, fontSize: 15, color: '#B4443B' },
});
