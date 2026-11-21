import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Chips, DangerButton, FieldLabel, Stepper, TextField } from '@/components/form';
import { Sheet, SheetButton, SheetTitle } from '@/components/sheet';
import { confirmDelete } from '@/lib/confirm';
import { toast } from '@/lib/toast';
import { useApp } from '@/store/useApp';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Add or edit a bill. You get a reminder 3 days before and on the day. */
export default function EditBill() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const bill = useApp((s) => (id ? s.bills.find((b) => b.id === id) : undefined));
  const saveBill = useApp((s) => s.saveBill);
  const removeBill = useApp((s) => s.removeBill);

  const [title, setTitle] = useState(bill?.title ?? '');
  const [dueDay, setDueDay] = useState(bill?.dueDay ?? 1);
  const [repeat, setRepeat] = useState<'monthly' | 'yearly'>(bill?.repeat ?? 'monthly');
  const [month, setMonth] = useState(bill?.month ?? new Date().getMonth() + 1);

  if (id && !bill) {
    router.back();
    return null;
  }

  const save = () => {
    if (!title.trim()) {
      toast('Give the bill a name first.');
      return;
    }
    saveBill({ id: bill?.id, title, dueDay, repeat, month: repeat === 'yearly' ? month : undefined, paidFor: bill?.paidFor });
    toast('Saved.');
    router.back();
  };

  return (
    <Sheet>
      <SheetTitle title={bill ? 'Edit bill' : 'New bill'} sub="A reminder comes 3 days before and on the due day." />

      <FieldLabel>Name</FieldLabel>
      <TextField value={title} onChange={setTitle} placeholder="e.g. Electricity bill" label="Bill name" maxLength={60} />

      <FieldLabel>Repeats</FieldLabel>
      <Chips
        value={repeat}
        onChange={setRepeat}
        options={[
          { value: 'monthly', label: 'Every month' },
          { value: 'yearly', label: 'Every year' },
        ]}
      />

      <FieldLabel>Due day of the month</FieldLabel>
      <Stepper value={dueDay} onChange={setDueDay} min={1} max={31} step={1} label="Due day" />

      {repeat === 'yearly' ? (
        <>
          <FieldLabel>Month</FieldLabel>
          <Stepper value={month} onChange={setMonth} min={1} max={12} step={1} format={(v) => MONTHS[v - 1]} label="Month" />
        </>
      ) : null}

      <SheetButton primary label={bill ? 'Save' : 'Add bill'} onPress={save} />
      {bill ? (
        <DangerButton label="Delete bill" onPress={() => confirmDelete(`Delete "${bill.title}"?`, 'Its reminders stop.', () => { removeBill(bill.id); toast('Deleted.'); router.back(); })} />
      ) : null}
    </Sheet>
  );
}
