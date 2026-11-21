import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Sheet, SheetButton, SheetOption, SheetTitle, SHEET } from '@/components/sheet';
import { openTask } from '@/focus/service';
import { usePlan } from '@/hooks/usePlan';
import { toast } from '@/lib/toast';
import { dur, fmt } from '@/planner';
import { useApp } from '@/store/useApp';
import { FONT } from '@/theme';

/** "You're free. Doing what?" Pick an answer; it is saved to your activity log. */
export default function CheckIn() {
  const { s, e } = useLocalSearchParams<{ s?: string; e?: string }>();
  const plan = usePlan();
  const log = useApp((st) => st.logActivity);
  const [text, setText] = useState('');
  const next = plan.placed.find((b) => !b.pred);
  const start = Number(s ?? plan.now);
  const end = Number(e ?? plan.now + 30);

  const done = (entry: string, message: string) => {
    log(entry);
    router.back();
    toast(message);
  };

  return (
    <Sheet>
      <SheetTitle title={`You're free for ${dur(Math.max(5, end - start))}`} sub={`${fmt(start)} to ${fmt(end)}. What are you doing right now?`} />
      {next ? (
        <SheetOption
          icon="play-outline"
          label="Start the next task"
          sub={`${next.t.title} · ${dur(next.t.mins)}`}
          onPress={() => {
            log(`Started: ${next.t.title}`);
            router.back();
            setTimeout(() => openTask(next.t.id), 350);
          }}
        />
      ) : null}
      <SheetOption icon="moon-outline" label="Resting, 15 min" sub="Logged. No judgment." onPress={() => done('Resting 15 min', 'Rest logged.')} />
      <SheetOption icon="time-outline" label="Scrolling, honestly" sub="Logged. Honest is good." onPress={() => done('Scrolling', "Logged. Let's start something small next.")} />
      <View style={styles.row}>
        <TextInput value={text} onChangeText={setText} placeholder="Something else…" placeholderTextColor="#B7A8AE" maxLength={50} style={styles.input} accessibilityLabel="What are you doing" />
        <View style={{ width: 90 }}>
          <SheetButton label="Log" primary disabled={!text.trim()} onPress={() => done(text.trim(), `Logged: ${text.trim()}`)} />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginTop: 4 },
  input: { flex: 1, height: 54, borderRadius: 16, borderWidth: 2, borderColor: SHEET.line, backgroundColor: '#fff', paddingHorizontal: 16, fontFamily: FONT.bodySemi, fontSize: 15, color: SHEET.ink, marginTop: 10 },
});
