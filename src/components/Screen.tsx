import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePhase } from '@/theme';

/** Safe-area padding and a scrolling body that clears the tab bar. The sky is drawn once, behind everything. */
export function Screen({ children }: { children: ReactNode }) {
  const { palette } = usePhase();
  const insets = useSafeAreaInsets();
  // Tab scenes stay mounted. Hide the ones not in front so they never draw over the sky.
  const focused = useIsFocused();
  return (
    <View style={[styles.root, !focused && styles.hidden]}>
      {focused ? <StatusBar style={palette.statusBar} /> : null}
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 18, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, hidden: { display: 'none' } });
