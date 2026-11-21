import { Platform, ToastAndroid } from 'react-native';

/** A short message at the bottom of the screen. Android only for now. */
export function toast(message: string): void {
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
}
