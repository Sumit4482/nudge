import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { FONT, usePhase } from '@/theme';

function TabIcon({ name, focused }: { name: keyof typeof Feather.glyphMap; focused: boolean }) {
  const { palette } = usePhase();
  return <Feather name={name} size={22} color={focused ? palette.accent : palette.mute} />;
}

const icon =
  (name: keyof typeof Feather.glyphMap) =>
  // eslint-disable-next-line react/display-name
  ({ focused }: { focused: boolean }) => <TabIcon name={name} focused={focused} />;

export default function TabsLayout() {
  const { palette } = usePhase();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.mute,
        tabBarLabelStyle: { fontFamily: FONT.bodySemi, fontSize: 11, lineHeight: 16 },
        tabBarStyle: {
          // Solid, so scrolling content never shows through the bar.
          backgroundColor: palette.sky[2],
          borderTopColor: palette.line,
          borderTopWidth: 1,
          elevation: 0,
          position: 'absolute',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Today', tabBarIcon: icon('sun') }}
      />
      <Tabs.Screen
        name="routines"
        options={{ title: 'Routines', tabBarIcon: icon('repeat') }}
      />
      <Tabs.Screen
        name="study"
        options={{ title: 'Study', tabBarIcon: icon('book-open') }}
      />
      <Tabs.Screen
        name="rewards"
        options={{ title: 'You', tabBarIcon: icon('award') }}
      />
    </Tabs>
  );
}
