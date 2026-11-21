import { Alert, Platform } from 'react-native';

/** Ask before deleting. Native alert on the phone, browser confirm on the web preview. */
export function confirmDelete(title: string, message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Keep', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onYes },
  ]);
}
