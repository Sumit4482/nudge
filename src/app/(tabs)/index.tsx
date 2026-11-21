import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { DemoPanel } from '@/features/dev/DemoPanel';
import { AddTaskSheet } from '@/features/today/AddTaskSheet';
import { DayRail } from '@/features/today/DayRail';
import { Extras } from '@/features/today/Extras';
import { Header } from '@/features/today/Header';
import { Timeline } from '@/features/today/Timeline';
import { openTask } from '@/focus/service';
import { usePlan } from '@/hooks/usePlan';
import { usePhase } from '@/theme';

export default function Today() {
  const plan = usePlan();
  const { palette } = usePhase();
  const insets = useSafeAreaInsets();
  const [adding, setAdding] = useState(false);
  const focused = useIsFocused();

  return (
    <View style={[styles.root, !focused && styles.hidden]}>
      <Screen>
        <Header plan={plan} now={plan.now} dow={plan.dow} />
        {__DEV__ ? <DemoPanel now={plan.now} dow={plan.dow} /> : null}
        <DayRail now={plan.now} dow={plan.dow} date={plan.date} />
        <Extras date={plan.date} />
        <Timeline plan={plan} now={plan.now} dow={plan.dow} date={plan.date} onOpenTask={openTask} />
      </Screen>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add task"
        onPress={() => setAdding(true)}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 76, backgroundColor: palette.ink, transform: [{ scale: pressed ? 0.94 : 1 }] },
        ]}
      >
        <Ionicons name="add" size={28} color={palette.sky[0]} />
      </Pressable>
      <AddTaskSheet visible={adding} dow={plan.dow} onClose={() => setAdding(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hidden: { display: 'none' },
  fab: { position: 'absolute', right: 18, width: 58, height: 58, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 6 },
});
