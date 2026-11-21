import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chips, DangerButton, FieldLabel, TextField } from '@/components/form';
import { Sheet, SheetTitle, SHEET } from '@/components/sheet';
import { addDays } from '@/lib/dates';
import { confirmDelete } from '@/lib/confirm';
import { toast } from '@/lib/toast';
import { useApp } from '@/store/useApp';
import { FONT } from '@/theme';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Add and remove subjects and topics, and set an exam or target date for a subject. */
export default function EditStudy() {
  const study = useApp((s) => s.study);
  const today = useApp((s) => s.date);
  const addSubject = useApp((s) => s.addSubject);
  const removeSubject = useApp((s) => s.removeSubject);
  const addTopic = useApp((s) => s.addTopic);
  const removeTopic = useApp((s) => s.removeTopic);
  const setExam = useApp((s) => s.setExam);

  const [picked, setPicked] = useState(study.subjects[0] ?? '');
  const subject = study.subjects.includes(picked) ? picked : (study.subjects[0] ?? '');
  const [newSubject, setNewSubject] = useState('');
  const [topic, setTopic] = useState('');
  const exam = study.exams.find((e) => e.subject === subject);
  const [date, setDate] = useState('');

  const topics = study.chapters[subject] ?? [];

  const onAddSubject = () => {
    if (!newSubject.trim()) return;
    if (addSubject(newSubject)) {
      setPicked(newSubject.trim().slice(0, 40));
      setNewSubject('');
      toast('Subject added.');
    } else toast('That subject already exists.');
  };

  const onAddTopic = () => {
    if (!topic.trim()) return;
    if (addTopic(subject, topic)) setTopic('');
    else toast('That topic is already there.');
  };

  const saveDate = (value: string) => {
    if (!DATE.test(value) || Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())) {
      toast('Use the format YYYY-MM-DD, for example 2027-03-15.');
      return;
    }
    setExam(subject, value);
    setDate('');
    toast('Date saved.');
  };

  return (
    <Sheet>
      <SheetTitle title="Subjects and topics" sub="Tap a topic's ✕ to remove it. Tap a topic chip on the Study tab to track progress." />

      {study.subjects.length ? (
        <>
          <FieldLabel>Subject</FieldLabel>
          <Chips value={subject} onChange={setPicked} options={study.subjects.map((s) => ({ value: s, label: s }))} />
        </>
      ) : null}

      <FieldLabel>Add a subject</FieldLabel>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextField value={newSubject} onChange={setNewSubject} placeholder="e.g. Databases" label="New subject" maxLength={40} />
        </View>
        <SheetButtonSmall label="Add" onPress={onAddSubject} />
      </View>

      {subject ? (
        <>
          <FieldLabel>{`Topics in ${subject}`}</FieldLabel>
          {topics.length === 0 ? <Text style={styles.empty}>No topics yet. Add the first one below.</Text> : null}
          {topics.map((c, i) => (
            <View key={`${i}-${c.name}`} style={styles.topic}>
              <Text style={styles.topicText} numberOfLines={2}>
                {c.name}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${c.name}`} onPress={() => removeTopic(subject, i)} hitSlop={8} style={styles.x}>
                <Ionicons name="close" size={18} color={SHEET.mute} />
              </Pressable>
            </View>
          ))}
          <View style={[styles.row, { marginTop: 10 }]}>
            <View style={{ flex: 1 }}>
              <TextField value={topic} onChange={setTopic} placeholder="New topic" label="New topic" maxLength={80} />
            </View>
            <SheetButtonSmall label="Add" onPress={onAddTopic} />
          </View>

          <FieldLabel>Exam or target date</FieldLabel>
          <Text style={styles.empty}>{exam ? `Now: ${exam.date}` : 'None set.'}</Text>
          <View style={[styles.row, { marginTop: 8 }]}>
            <View style={{ flex: 1 }}>
              <TextField value={date} onChange={setDate} placeholder="YYYY-MM-DD" label="Date" maxLength={10} />
            </View>
            <SheetButtonSmall label="Save" onPress={() => saveDate(date)} />
          </View>
          <View style={[styles.row, { marginTop: 10, flexWrap: 'wrap' }]}>
            {[30, 60, 90].map((n) => (
              <Pressable key={n} accessibilityRole="button" onPress={() => saveDate(addDays(today || new Date().toISOString().slice(0, 10), n))} style={styles.pill}>
                <Text style={styles.pillText}>{`In ${n} days`}</Text>
              </Pressable>
            ))}
            {exam ? (
              <Pressable accessibilityRole="button" onPress={() => { setExam(subject, null); toast('Date cleared.'); }} style={styles.pill}>
                <Text style={styles.pillText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          <DangerButton
            label={`Delete ${subject}`}
            onPress={() => confirmDelete(`Delete ${subject}?`, 'Its topics and date are removed. Your finished sessions stay in your history.', () => { removeSubject(subject); toast('Subject deleted.'); })}
          />
        </>
      ) : (
        <Text style={styles.empty}>No subjects yet. Add one above.</Text>
      )}
    </Sheet>
  );
}

function SheetButtonSmall({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.small}>
      <Text style={styles.smallText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  empty: { fontFamily: FONT.body, fontSize: 13, color: SHEET.mute },
  topic: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: SHEET.soft, borderRadius: 14, paddingVertical: 9, paddingLeft: 12, paddingRight: 6, marginBottom: 6 },
  topicText: { flex: 1, fontFamily: FONT.bodySemi, fontSize: 14, color: SHEET.ink },
  x: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  small: { height: 50, paddingHorizontal: 18, borderRadius: 16, backgroundColor: SHEET.ink, alignItems: 'center', justifyContent: 'center' },
  smallText: { fontFamily: FONT.display, fontSize: 15, color: '#fff' },
  pill: { height: 36, paddingHorizontal: 14, borderRadius: 12, backgroundColor: SHEET.soft, justifyContent: 'center' },
  pillText: { fontFamily: FONT.bodySemi, fontSize: 13, color: SHEET.ink },
});
