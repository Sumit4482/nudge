import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { toast } from '@/lib/toast';
import { useApp } from '@/store/useApp';
import { FONT, usePhase } from '@/theme';

/** Water tracker and the rest-mode banner. */
export function Extras({ date }: { date: string }) {
  const { palette } = usePhase();
  const rest = useApp((s) => s.rest);
  const restUntil = useApp((s) => s.restUntil);
  const water = useApp((s) => s.water);
  const setRest = useApp((s) => s.setRest);

  const glasses = water.date === date ? water.glasses : 0;
  const onWater = () => {
    const n = useApp.getState().tapWater(date);
    toast(n === 8 ? 'Goal hit. 2 litres done.' : '+250 ml. Nice.');
  };

  return (
    <View>
      {rest !== 'normal' ? (
        <View style={[styles.banner, { backgroundColor: palette.card }]}>
          <Ionicons name={rest === 'travel' ? 'airplane-outline' : 'heart-outline'} size={18} color={palette.ink} />
          <Text style={{ flex: 1, color: palette.ink, fontFamily: FONT.body, fontSize: 13, lineHeight: 18 }}>
            {`${rest === 'travel' ? 'Travel mode' : 'Sick mode'}${restUntil ? ` until ${restUntil.slice(5)}` : ''}: routines paused, nothing rolls over, streak frozen.${rest === 'sick' ? ' Reminders stay quiet.' : ''}`}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setRest('normal')}>
            <Text style={{ color: palette.accent, fontFamily: FONT.bodyBold, fontSize: 13, padding: 6 }}>End</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel="Add a glass of water" onPress={onWater} style={({ pressed }) => [styles.card, { backgroundColor: palette.card, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
          <View style={[styles.icon, { backgroundColor: `${palette.accent}2A` }]}>
            <Ionicons name="water-outline" size={18} color={palette.accent} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text numberOfLines={1} style={{ color: palette.ink, fontFamily: FONT.bodySemi, fontSize: 13.5 }}>{`${glasses}/8 glasses`}</Text>
            <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 11.5 }}>Tap to add 250 ml</Text>
            <View style={[styles.bar, { backgroundColor: palette.line }]}>
              <View style={{ width: `${Math.min(100, (glasses / 8) * 100)}%`, height: '100%', backgroundColor: palette.accent, borderRadius: 4 }} />
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  card: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 20, padding: 12, minWidth: 0 },
  icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 4, borderRadius: 4, overflow: 'hidden', marginTop: 3 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, padding: 12, marginBottom: 12 },
});
