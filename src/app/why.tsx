import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Sheet, SheetButton, SheetOption, SheetTitle, SHEET } from '@/components/sheet';
import { startFocus } from '@/focus/service';
import { toast } from '@/lib/toast';
import { needsSplitOrDrop } from '@/planner/rollover';
import { breakdown } from '@/services/breakdown';
import { useApp } from '@/store/useApp';
import { Text } from 'react-native';
import { FONT } from '@/theme';

const WHY = {
  boring: ['Boring', 'Pair it with something you like. Capped at 10 minutes.', 'happy-outline'],
  scary: ['Scary', 'Make it tiny. Just the 2-minute starter.', 'flash-outline'],
  unclear: ['Unclear', 'Split it so the next step is obvious.', 'sparkles-outline'],
  tired: ['Tired', 'Fair. Move it to tomorrow. Your streak is safe.', 'moon-outline'],
} as const;
type Reason = keyof typeof WHY;

/** "Why am I avoiding this?" Four honest answers, each with a kind next step. */
export default function Why() {
  const { id, move } = useLocalSearchParams<{ id: string; move?: string }>();
  const task = useApp((s) => s.tasks.find((t) => t.id === id));
  const [busy, setBusy] = useState(false);
  if (!task) {
    router.back();
    return null;
  }
  const forced = move === '1';
  const stuck = needsSplitOrDrop(task);

  const choose = async (reason: Reason) => {
    const st = useApp.getState();
    if (forced || reason === 'tired') {
      st.moveTomorrow(task.id, reason); // records the reason itself
      router.back();
      toast(`Moved to tomorrow. Reason logged: ${WHY[reason][0]}.`);
      return;
    }
    st.recordReason(task.id, reason);
    if (reason === 'boring' || reason === 'scary') {
      await startFocus(task.id, reason === 'boring' ? 10 : 2);
      router.replace({ pathname: '/focus', params: { id: task.id } });
      return;
    }
    setBusy(true);
    const res = await breakdown(task.title, task.mins, task.tag);
    st.setSteps(task.id, res.steps);
    toast(`Split into ${res.steps.length} steps. Start with the first.`);
    router.replace({ pathname: '/focus', params: { id: task.id } });
  };

  return (
    <Sheet>
      <SheetTitle
        title="Why am I avoiding this?"
        sub={stuck ? `${task.title}. Skipped ${task.rolled} times. Split it, or let it go.` : `${task.title}. No judgment. Pick the closest one.`}
      />
      {busy ? <Text style={{ fontFamily: FONT.body, color: SHEET.mute, marginTop: 14 }}>Splitting it into small steps…</Text> : null}
      {(Object.keys(WHY) as Reason[]).map((k) => (
        <SheetOption key={k} icon={WHY[k][2]} label={WHY[k][0]} sub={WHY[k][1]} onPress={() => !busy && choose(k)} />
      ))}
      {stuck ? (
        <SheetButton
          label="Drop this task"
          icon="trash-outline"
          onPress={() => {
            useApp.getState().dropTask(task.id);
            router.back();
            toast('Dropped. One less thing.');
          }}
        />
      ) : null}
    </Sheet>
  );
}
