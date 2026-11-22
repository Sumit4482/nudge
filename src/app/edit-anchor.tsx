import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { DangerButton, FieldLabel, Stepper } from '@/components/form';
import { Sheet, SheetButton, SheetTitle, SHEET } from '@/components/sheet';
import { useNow } from '@/hooks/useNow';
import { toast } from '@/lib/toast';
import { fmt } from '@/planner';
import { useApp } from '@/store/useApp';
import { FONT } from '@/theme';
import type { AnchorKey } from '@/types';

const NAMES: Record<AnchorKey, string> = { wake: 'Woke up', leave: 'Left for office', home: 'Got home', sleep: 'Went to sleep' };
const ORDER: AnchorKey[] = ['wake', 'leave', 'home', 'sleep'];

/** Fix a time you tapped by mistake, set one you forgot to tap, or undo a tap. */
export default function EditAnchor() {
  const { key } = useLocalSearchParams<{ key?: string }>();
  const anchorKey = (ORDER as string[]).includes(key ?? '') ? (key as AnchorKey) : null;
  const { now } = useNow();
  const anchors = useApp((s) => s.anchors);
  const setAnchor = useApp((s) => s.setAnchor);
  const clearAnchor = useApp((s) => s.clearAnchor);

  const current = anchorKey ? anchors[anchorKey] : undefined;
  const before = anchorKey ? ORDER.slice(0, ORDER.indexOf(anchorKey)).map((k) => anchors[k]).filter((v): v is number => v != null) : [];
  const after = anchorKey ? ORDER.slice(ORDER.indexOf(anchorKey) + 1).map((k) => anchors[k]).filter((v): v is number => v != null) : [];
  const lower = before.length ? Math.max(...before) : 0;
  const upper = Math.min(now, after.length ? Math.min(...after) : 1439);
  const [minutes, setMinutes] = useState(Math.min(upper, Math.max(lower, current ?? now)));

  if (!anchorKey) {
    router.back();
    return null;
  }
  const isSet = current != null;

  const save = () => {
    const err = setAnchor(anchorKey, minutes, now);
    if (err) {
      toast(err);
      return;
    }
    toast(isSet ? `${NAMES[anchorKey]} changed to ${fmt(minutes)}.` : `${NAMES[anchorKey]} set to ${fmt(minutes)}. The day re-plans.`);
    router.back();
  };

  const undo = () => {
    if (!clearAnchor(anchorKey)) {
      toast('Bedtime closes the day, so it cannot be undone. You can still change its time.');
      return;
    }
    toast(`${NAMES[anchorKey]} undone.`);
    router.back();
  };

  return (
    <Sheet>
      <SheetTitle title={isSet ? NAMES[anchorKey] : `Set: ${NAMES[anchorKey]}`} sub={isSet ? 'Wrong time? Move it, or undo the tap.' : 'Forgot to tap? Set the time it really happened.'} />

      <FieldLabel>Time</FieldLabel>
      <Stepper value={minutes} onChange={setMinutes} min={lower} max={Math.max(lower, upper)} step={5} format={fmt} label="Time" />
      <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: SHEET.mute, marginTop: 8 }}>
        {`It can be between ${fmt(lower)} and ${fmt(Math.max(lower, upper))}. Today re-plans from this time.`}
      </Text>
      {anchorKey === 'sleep' && isSet ? (
        <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: SHEET.mute, marginTop: 6 }}>Tasks were already rolled over at bedtime, so this only changes the logged time.</Text>
      ) : null}

      <SheetButton primary label={isSet ? 'Save time' : 'Set this time'} onPress={save} />
      {isSet && anchorKey !== 'sleep' ? <DangerButton label="Undo this tap" onPress={undo} /> : null}
    </Sheet>
  );
}
