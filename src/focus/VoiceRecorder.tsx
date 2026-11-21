import type { ComponentType } from 'react';
import { StyleSheet, Text } from 'react-native';
import { FONT } from '@/theme';
import type { VoiceProps } from './VoiceRecorderImpl';

/**
 * The audio module is native. If this build was made before it was added, requiring it throws.
 * We catch that so the rest of the app keeps working and show a calm message instead.
 */
let Impl: ComponentType<VoiceProps> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Impl = require('./VoiceRecorderImpl').default;
} catch {
  Impl = null;
}

export const voiceAvailable = Impl != null;

export function VoiceRecorder(props: VoiceProps) {
  if (!Impl) return <Text style={styles.note}>Voice notes need the next app build. Use a photo for now.</Text>;
  return <Impl {...props} />;
}

const styles = StyleSheet.create({ note: { fontFamily: FONT.body, fontSize: 13, color: '#7C6B72', textAlign: 'center', marginTop: 14 } });
