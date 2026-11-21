import { Ionicons } from '@expo/vector-icons';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT } from '@/theme';

const INK = '#2A1B33';
const MUTE = '#7C6B72';
const SOFT = '#F6EBE0';
const ACCENT = '#CB6747';

export interface VoiceProps {
  minSeconds?: number;
  maxSeconds?: number;
  onDone: (uri: string, seconds: number) => void;
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Records a short voice note ("teach it back"). Loaded only when the audio module exists in the build. */
export default function VoiceRecorderImpl({ minSeconds = 20, maxSeconds = 60, onDone }: VoiceProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const [phase, setPhase] = useState<'idle' | 'rec' | 'done'>('idle');
  const secs = Math.floor((state.durationMillis ?? 0) / 1000);

  const stop = async () => {
    const seconds = Math.floor((recorder.currentTime ?? 0) || secs);
    await recorder.stop();
    setPhase('done');
    if (recorder.uri) onDone(recorder.uri, Math.max(seconds, secs));
  };

  // Stop by itself at the maximum length.
  useEffect(() => {
    if (phase === 'rec' && secs >= maxSeconds) {
      recorder.stop().then(() => {
        setPhase('done');
        if (recorder.uri) onDone(recorder.uri, maxSeconds);
      });
    }
  }, [phase, secs, maxSeconds, recorder, onDone]);

  const start = async () => {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Microphone is off', 'Allow the microphone in Android settings to record a voice note.');
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setPhase('rec');
  };

  const enough = secs >= minSeconds;
  return (
    <View style={styles.box}>
      <Ionicons name={phase === 'done' ? 'checkmark-circle-outline' : 'mic-outline'} size={34} color={phase === 'rec' ? ACCENT : MUTE} />
      <Text style={styles.time}>{clock(secs)}</Text>
      <Text style={styles.hint}>
        {phase === 'idle' ? `Explain it like you're teaching a friend. ${minSeconds} to ${maxSeconds} seconds.` : phase === 'rec' ? (enough ? 'Good. Stop whenever you are done.' : `Keep going. ${minSeconds - secs}s to the minimum.`) : 'Saved. You can submit now.'}
      </Text>
      {phase === 'idle' ? (
        <Pressable accessibilityRole="button" onPress={start} style={[styles.btn, { backgroundColor: ACCENT }]}>
          <Text style={[styles.btnText, { color: '#fff' }]}>Start recording</Text>
        </Pressable>
      ) : null}
      {phase === 'rec' ? (
        <Pressable accessibilityRole="button" onPress={stop} disabled={!enough} style={[styles.btn, { backgroundColor: enough ? ACCENT : SOFT, opacity: enough ? 1 : 0.6 }]}>
          <Text style={[styles.btnText, { color: enough ? '#fff' : INK }]}>Stop recording</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: 8, padding: 18, borderRadius: 24, backgroundColor: SOFT, marginTop: 16 },
  time: { fontFamily: FONT.mono, fontSize: 30, color: INK },
  hint: { fontFamily: FONT.body, fontSize: 13, color: MUTE, textAlign: 'center', lineHeight: 18 },
  btn: { height: 48, paddingHorizontal: 22, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  btnText: { fontFamily: FONT.display, fontSize: 15 },
});
