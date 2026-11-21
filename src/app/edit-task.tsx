import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Chips, DangerButton, DayPicker, FieldLabel, Stepper, SwitchRow, TextField } from '@/components/form';
import { Sheet, SheetButton, SheetTitle, SHEET } from '@/components/sheet';
import { confirmDelete } from '@/lib/confirm';
import { toast } from '@/lib/toast';
import { dur, isDue, MAX_MUST } from '@/planner';
import { useApp } from '@/store/useApp';
import { FONT } from '@/theme';
import type { Tag, Task } from '@/types';

type Mode = 'every' | 'days' | 'everyN';
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** The first weekday that would have more than 3 must-dos if this task were a must-do, or null. */
function mustOverflow(tasks: Task[], self: Task): string | null {
  for (let dow = 0; dow < 7; dow++) {
    const others = tasks.filter((t) => t.id !== self.id && t.must && isDue({ ...t, done: false }, dow));
    if (isDue({ ...self, done: false }, dow) && others.length + 1 > MAX_MUST) return DAY_NAMES[dow];
  }
  return null;
}

/** Edit a task or routine, or add a new routine. */
export default function EditTask() {
  const { id, mode: newMode } = useLocalSearchParams<{ id?: string; mode?: string }>();
  const existing = useApp((s) => (id ? s.tasks.find((t) => t.id === id) : undefined));
  const tasks = useApp((s) => s.tasks);
  const active = useApp((s) => s.active);
  const updateTask = useApp((s) => s.updateTask);
  const addRoutine = useApp((s) => s.addRoutine);
  const dropTask = useApp((s) => s.dropTask);
  const setRoutineOff = useApp((s) => s.setRoutineOff);

  const isNew = !existing;
  const routine = isNew ? true : !!existing?.routine;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [mins, setMins] = useState(existing?.mins ?? 30);
  const [tag, setTag] = useState<Tag>(existing?.tag ?? 'life');
  const [pref, setPref] = useState<Task['pref']>(existing?.pref ?? 'any');
  const [must, setMust] = useState(existing?.must ?? false);
  const [steps, setSteps] = useState((existing?.steps ?? []).join('\n'));
  const [off, setOff] = useState(!!existing?.off);
  const [mode, setMode] = useState<Mode>(existing?.everyDays ? 'everyN' : existing?.days?.length ? 'days' : 'every');
  const [days, setDays] = useState<number[]>(existing?.days ?? [1, 3, 5]);
  const [everyN, setEveryN] = useState(existing?.everyDays ?? 2);

  if (!isNew && !existing) {
    router.back();
    return null;
  }

  const draft = (): Task => ({
    id: existing?.id ?? 'new',
    title: title.trim() || 'x',
    mins,
    tag,
    must,
    prio: must ? 3 : 2,
    pref,
    rolled: 0,
    routine,
    ...(mode === 'everyN' ? { everyDays: everyN } : mode === 'days' ? { days } : {}),
  });

  const onMust = (v: boolean) => {
    if (v) {
      const bad = mustOverflow(tasks, { ...draft(), must: true });
      if (bad) {
        toast(`That would make more than ${MAX_MUST} must-dos on ${bad}. Clear one first.`);
        return;
      }
    }
    setMust(v);
  };

  const save = () => {
    if (!title.trim()) {
      toast('Give it a name first.');
      return;
    }
    if (mode === 'days' && days.length === 0) {
      toast('Pick at least one day, or choose Every day.');
      return;
    }
    const lines = steps.split('\n');
    const schedule =
      mode === 'everyN' ? { everyDays: everyN } : mode === 'days' ? { days } : { days: [] as number[], everyDays: 0 };
    if (existing) {
      updateTask(existing.id, { title, mins, tag, pref, must, steps: lines, ...(routine ? schedule : {}) });
      if (routine) setRoutineOff(existing.id, off);
      toast('Saved.');
    } else {
      const created = addRoutine({
        title,
        mins,
        tag,
        pref,
        must,
        steps: lines,
        ...(mode === 'everyN' ? { everyDays: everyN } : mode === 'days' ? { days } : {}),
      });
      if (!created) return;
      toast('Routine added.');
    }
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    if (active?.taskId === existing.id) {
      toast('Finish the current run first, then delete it.');
      return;
    }
    confirmDelete(`Delete "${existing.title}"?`, routine ? 'It will not come back. You can add it again later.' : 'This removes it from your plan.', () => {
      dropTask(existing.id);
      toast('Deleted.');
      router.back();
    });
  };

  return (
    <Sheet>
      <SheetTitle title={isNew ? 'New routine' : routine ? 'Edit routine' : 'Edit task'} sub={newMode === 'task' ? undefined : 'Changes apply from the next plan.'} />

      <FieldLabel>Name</FieldLabel>
      <TextField value={title} onChange={setTitle} placeholder="e.g. Evening walk" label="Name" maxLength={80} />

      <FieldLabel>How long</FieldLabel>
      <Stepper value={mins} onChange={setMins} min={1} max={480} step={mins >= 60 ? 15 : 5} format={dur} label="Length" />

      <FieldLabel>Type</FieldLabel>
      <Chips
        value={tag}
        onChange={setTag}
        options={[
          { value: 'fit', label: 'Fitness' },
          { value: 'study', label: 'Study' },
          { value: 'life', label: 'Life' },
        ]}
      />

      <FieldLabel>Best time of day</FieldLabel>
      <Chips
        value={pref}
        onChange={setPref}
        options={[
          { value: 'morning', label: 'Morning' },
          { value: 'evening', label: 'Evening' },
          { value: 'any', label: 'Any' },
        ]}
      />

      {routine ? (
        <>
          <FieldLabel>Repeats</FieldLabel>
          <Chips
            value={mode}
            onChange={setMode}
            options={[
              { value: 'every', label: 'Every day' },
              { value: 'days', label: 'Chosen days' },
              { value: 'everyN', label: 'Every N days' },
            ]}
          />
          {mode === 'days' ? (
            <>
              <FieldLabel>Days</FieldLabel>
              <DayPicker value={days} onChange={setDays} />
            </>
          ) : null}
          {mode === 'everyN' ? (
            <>
              <FieldLabel>Every how many days</FieldLabel>
              <Stepper value={everyN} onChange={setEveryN} min={1} max={30} step={1} format={(v) => `${v} day${v === 1 ? '' : 's'}`} label="Interval" />
              <Text style={{ fontFamily: FONT.body, fontSize: 12.5, color: SHEET.mute, marginTop: 8 }}>
                It comes back this many days after you last finish it, and stays due until you do.
              </Text>
            </>
          ) : null}
        </>
      ) : null}

      <SwitchRow label="Must do" sub={`At most ${MAX_MUST} must-dos a day, counted across your week.`} value={must} onChange={onMust} />
      {routine && existing ? <SwitchRow label="Routine is on" sub="Turn off to pause it without deleting." value={!off} onChange={(v) => setOff(!v)} /> : null}

      <FieldLabel>Steps</FieldLabel>
      <TextField value={steps} onChange={setSteps} multiline placeholder={'One step per line.\nMake the first step 2 minutes or less.'} label="Steps" />

      <SheetButton primary label={isNew ? 'Add routine' : 'Save'} onPress={save} />
      {existing ? <DangerButton label={routine ? 'Delete routine' : 'Delete task'} onPress={remove} /> : null}
    </Sheet>
  );
}
