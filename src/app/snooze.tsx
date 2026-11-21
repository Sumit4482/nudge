import { router, useLocalSearchParams } from 'expo-router';
import { Sheet, SheetButton, SheetTitle } from '@/components/sheet';
import { startFocus } from '@/focus/service';

/** The third snooze costs something: do a 2-minute version, or move it and say why. */
export default function SnoozeCost() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Sheet>
      <SheetTitle title="No snoozes left" sub="Two per task per day. To keep going, do the 2-minute version, or move it to tomorrow and tell me why." />
      <SheetButton
        primary
        icon="flash-outline"
        label="Start 2 minutes"
        onPress={async () => {
          await startFocus(id, 2);
          router.replace({ pathname: '/focus', params: { id } });
        }}
      />
      <SheetButton label="Move to tomorrow" onPress={() => router.replace({ pathname: '/why', params: { id, move: '1' } })} />
    </Sheet>
  );
}
