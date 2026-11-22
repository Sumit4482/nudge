import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { TAG_META } from '@/components/tagMeta';
import { PrimaryButton } from '@/components/ui';
import { saveProofFile } from '@/focus/proofFile';
import { finishWithProof } from '@/focus/service';
import { VoiceRecorder } from '@/focus/VoiceRecorder';
import { toast } from '@/lib/toast';
import { useApp } from '@/store/useApp';
import { useWallSession } from '@/wall/useSession';
import { FONT } from '@/theme';
import type { Tag } from '@/types';

const INK = '#2A1B33';
const MUTE = '#7C6B72';
const SOFT = '#F6EBE0';
const ACCENT = '#CB6747';

/**
 * Proof sheet. Three uses:
 * - finishing the active task (photo, or a voice note for study tasks),
 * - paying a bill (a screenshot or photo),
 * - teach it back (a voice note about a subject).
 */
export default function Proof() {
  const p = useLocalSearchParams<{ bill?: string; due?: string; teach?: string; subject?: string }>();
  const active = useApp((s) => s.active);
  const bills = useApp((s) => s.bills);
  const activeTag = useApp((s) => s.tasks.find((t) => t.id === s.active?.taskId)?.tag ?? 'life');
  const [uri, setUri] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wall = useWallSession();
  const [shareOverride, setShareOverride] = useState<boolean | null>(null);

  const bill = p.bill ? bills.find((b) => b.id === p.bill) : undefined;
  const mode: 'bill' | 'teach' | 'task' = p.bill ? 'bill' : p.teach ? 'teach' : 'task';
  const tag: Tag = mode === 'bill' ? 'life' : mode === 'teach' ? 'study' : activeTag;
  const title = mode === 'bill' ? `Payment: ${bill?.title ?? 'bill'}` : mode === 'teach' ? `Teach it back: ${p.subject ?? 'a chapter'}` : (active?.title ?? '');
  const canVoice = mode === 'teach' || (mode === 'task' && tag === 'study');
  const showPhoto = mode !== 'teach';
  const ready = mode === 'teach' ? !!audio : !!uri || !!audio;
  // Posting to the public wall: photos only, never bills or voice notes. On by default; switch it off for a private one.
  const canShare = wall.configured && mode === 'task' && !!uri && !audio;
  const share = canShare && !!wall.userId && (shareOverride ?? true);

  const take = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera is off', 'Allow the camera in Android settings, or choose a photo from your gallery.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled) setUri(res.assets[0].uri);
  };

  const choose = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled) setUri(res.assets[0].uri);
  };

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const photo = uri ? await saveProofFile(uri, 'jpg') : undefined;
      const voice = audio ? await saveProofFile(audio, 'm4a') : undefined;
      const st = useApp.getState();
      if (mode === 'bill' && bill && p.due) st.payBill(bill.id, p.due, photo);
      else if (mode === 'teach') st.award({ title, tag: 'study', xp: 25, audio: voice });
      else await finishWithProof({ photo, audio: voice }, share);
      st.setWallNote(`Submitted: ${canShare ? (share ? 'queued for the wall' : wall.userId ? 'not shared, switch off' : 'not shared, not signed in') : `not shareable (${!wall.configured ? 'wall not configured' : mode !== 'task' ? mode : !uri ? 'no photo' : 'voice note'})`}.`);
      if (canShare) {
        toast(share ? (st.wallDelay ? `Queued for your wall. It posts in ${st.wallDelay} min.` : 'Queued for your wall. It posts in a moment.') : wall.userId ? 'Not on your wall: the share switch was off.' : 'Not on your wall: sign in under Settings first.');
      }
      router.replace('/reward');
    } catch {
      setBusy(false);
      Alert.alert('Could not save the proof', 'Try again, or take another one.');
    }
  };

  if (mode === 'task' && !active) {
    return (
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />
        <View style={styles.sheet}>
          <Text style={styles.h2}>Nothing to finish</Text>
          <Text style={styles.sub}>Start a task first, then add proof here.</Text>
          <PrimaryButton label="Back" onPress={() => router.back()} style={{ backgroundColor: ACCENT, marginTop: 16 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} accessibilityLabel="Close" />
      <View style={styles.sheet}>
        <View style={styles.grab} />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.h2}>{mode === 'teach' ? 'Teach it back' : "Show me it's done"}</Text>
          <Text style={styles.sub}>
            {mode === 'teach'
              ? `${p.subject ?? 'A chapter'}. Explain it out loud. It counts as proof for study tasks.`
              : `${title}. Upload ${mode === 'bill' ? 'a screenshot or photo of the payment' : TAG_META[tag].proof}${canVoice ? ', or teach it back out loud' : ''}.`}
          </Text>

          {showPhoto ? (
            <>
              <View style={styles.drop}>
                {uri ? (
                  <Image source={{ uri }} style={StyleSheet.absoluteFill} accessibilityLabel="Your proof photo" />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={34} color={MUTE} />
                    <Text style={{ fontFamily: FONT.body, fontSize: 14, color: MUTE }}>Take a photo or choose one</Text>
                  </>
                )}
              </View>
              <View style={{ gap: 10, marginTop: 16 }}>
                <Pressable accessibilityRole="button" onPress={take} style={styles.secondary}>
                  <Ionicons name="camera-outline" size={20} color={INK} />
                  <Text style={styles.secondaryText}>{uri ? 'Take another' : 'Take a photo'}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={choose} style={styles.secondary}>
                  <Ionicons name="image-outline" size={20} color={INK} />
                  <Text style={styles.secondaryText}>Choose from gallery</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {canVoice ? (
            mode === 'teach' || voiceOpen ? (
              <VoiceRecorder onDone={(u) => setAudio(u)} />
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setVoiceOpen(true)} style={[styles.secondary, { marginTop: 10 }]}>
                <Ionicons name="mic-outline" size={20} color={INK} />
                <Text style={styles.secondaryText}>Teach it back (voice note)</Text>
              </Pressable>
            )
          ) : null}

          {canShare ? (
            <View style={styles.shareRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT.bodySemi, fontSize: 15, color: INK }}>Show on my proof wall</Text>
                <Text style={{ fontFamily: FONT.body, fontSize: 12, color: MUTE, marginTop: 2 }}>
                  {!wall.userId ? 'Sign in under Settings to post.' : share ? `On. Public, ${useApp.getState().wallDelay ? `posts after ${useApp.getState().wallDelay} min` : 'posts right away'}, location removed.` : 'Off. This proof stays on your phone.'}
                </Text>
              </View>
              <Switch value={share} disabled={!wall.userId} onValueChange={setShareOverride} trackColor={{ false: '#E4D8CF', true: '#3F9F7F' }} thumbColor="#fff" accessibilityLabel="Show on my proof wall" />
            </View>
          ) : null}

          <PrimaryButton label="Submit proof" icon="checkmark" disabled={!ready || busy} onPress={submit} style={{ backgroundColor: ACCENT, marginTop: 14 }} />
          <Text style={styles.fine}>Proof unlocks what&apos;s next.</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(14,16,40,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFAF4', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingTop: 10, maxHeight: '92%' },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 5, backgroundColor: 'rgba(42,27,51,0.18)', marginBottom: 14 },
  h2: { fontFamily: FONT.displayBold, fontSize: 24, color: INK, letterSpacing: -0.5 },
  sub: { fontFamily: FONT.body, fontSize: 14, color: MUTE, marginTop: 4, lineHeight: 20 },
  drop: { height: 220, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(42,27,51,0.14)', backgroundColor: SOFT, marginTop: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secondary: { height: 54, borderRadius: 18, backgroundColor: SOFT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  secondaryText: { fontFamily: FONT.display, fontSize: 16, color: INK },
  fine: { fontFamily: FONT.body, fontSize: 12, color: MUTE, textAlign: 'center', marginTop: 12 },
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
});
