import { router } from 'expo-router';
import { Sheet, SheetButton, SheetTitle } from '@/components/sheet';
import { useApp } from '@/store/useApp';

/** A staked task was missed. Shows what it cost. Nothing is deleted and nothing is sent anywhere. */
export default function Stake() {
  const pending = useApp((s) => s.pendingStake);
  const dismiss = useApp((s) => s.dismissPendingStake);

  if (!pending) {
    router.back();
    return null;
  }
  const close = () => {
    dismiss();
    router.back();
  };

  return (
    <Sheet onClose={close}>
      <SheetTitle title="Stake missed" sub={`${pending.titles.join(', ')} wasn't done. −${pending.loss} XP. Your garden rests a day. Nothing is deleted.`} />
      <SheetButton primary label="OK, fresh start" onPress={close} />
    </Sheet>
  );
}
