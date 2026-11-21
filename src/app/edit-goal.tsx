import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Chips, DangerButton, FieldLabel, Stepper, TextField } from '@/components/form';
import { Sheet, SheetButton, SheetTitle } from '@/components/sheet';
import { confirmDelete } from '@/lib/confirm';
import { toast } from '@/lib/toast';
import { useApp } from '@/store/useApp';

type Kind = 'tag' | 'chapters';
type Tag3 = 'fit' | 'study' | 'life';

/** Add or edit a goal: count finished sessions of a type, or finish topics in a subject. */
export default function EditGoal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const goal = useApp((s) => (id ? s.goals.find((g) => g.id === id) : undefined));
  const subjects = useApp((s) => s.study.subjects);
  const saveGoal = useApp((s) => s.saveGoal);
  const removeGoal = useApp((s) => s.removeGoal);

  const [title, setTitle] = useState(goal?.title ?? '');
  const [sub, setSub] = useState(goal?.sub ?? '');
  const [kind, setKind] = useState<Kind>(goal?.kind ?? 'tag');
  const [tag, setTag] = useState<Tag3>(goal?.tag ?? 'fit');
  const [subject, setSubject] = useState(goal?.subject ?? subjects[0] ?? '');
  const [target, setTarget] = useState(goal?.target ?? 10);

  if (id && !goal) {
    router.back();
    return null;
  }

  const save = () => {
    if (!title.trim()) {
      toast('Give the goal a name first.');
      return;
    }
    if (kind === 'chapters' && !subject) {
      toast('Add a subject on the Study tab first.');
      return;
    }
    saveGoal({
      id: goal?.id,
      title,
      sub,
      kind,
      tag: kind === 'tag' ? tag : undefined,
      subject: kind === 'chapters' ? subject : undefined,
      target,
      base: goal?.base ?? 0,
    });
    toast('Saved.');
    router.back();
  };

  return (
    <Sheet>
      <SheetTitle title={goal ? 'Edit goal' : 'New goal'} sub="A goal fills up as you finish things." />

      <FieldLabel>Name</FieldLabel>
      <TextField value={title} onChange={setTitle} placeholder="e.g. Train 22 sessions" label="Goal name" maxLength={60} />
      <FieldLabel>Note (optional)</FieldLabel>
      <TextField value={sub} onChange={setSub} placeholder="A line to remind you why" label="Goal note" maxLength={100} />

      <FieldLabel>What counts</FieldLabel>
      <Chips
        value={kind}
        onChange={setKind}
        options={[
          { value: 'tag', label: 'Finished sessions' },
          { value: 'chapters', label: 'Topics revised' },
        ]}
      />
      {kind === 'tag' ? (
        <>
          <FieldLabel>Type of session</FieldLabel>
          <Chips
            value={tag}
            onChange={setTag}
            options={[
              { value: 'fit', label: 'Fitness' },
              { value: 'study', label: 'Study' },
              { value: 'life', label: 'Life' },
            ]}
          />
        </>
      ) : (
        <>
          <FieldLabel>Subject</FieldLabel>
          {subjects.length ? <Chips value={subject} onChange={setSubject} options={subjects.map((s) => ({ value: s, label: s }))} /> : null}
        </>
      )}

      <FieldLabel>Target this month</FieldLabel>
      <Stepper value={target} onChange={setTarget} min={1} max={500} step={1} label="Target" />

      <SheetButton primary label={goal ? 'Save' : 'Add goal'} onPress={save} />
      {goal ? (
        <DangerButton
          label="Delete goal"
          onPress={() => confirmDelete(`Delete "${goal.title}"?`, 'The goal goes away. Your finished sessions stay.', () => { removeGoal(goal.id); toast('Deleted.'); router.back(); })}
        />
      ) : null}
    </Sheet>
  );
}
