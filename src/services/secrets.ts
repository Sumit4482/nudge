import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Keys for things that must never sit in normal app storage. */
export const SECRET = {
  anthropic: 'nudge.anthropicKey',
} as const;

export async function getSecret(key: string): Promise<string> {
  if (Platform.OS === 'web') return '';
  try {
    return (await SecureStore.getItemAsync(key)) ?? '';
  } catch {
    return '';
  }
}

export async function setSecret(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!value) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}
