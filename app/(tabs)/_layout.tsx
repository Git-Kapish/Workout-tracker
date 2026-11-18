import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { useWelcome } from '@/hooks/useWelcome';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const { seen } = useWelcome();
  const { colors } = useTheme();
  // First launch only: show the splash before any tab (no flash of Today first).
  if (!seen) return <Redirect href="/welcome" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      // Back (button or edge swipe) returns to the tab you came from, not always to Today.
      backBehavior="history"
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="week" options={{ title: 'Week' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="exercises" options={{ title: 'Exercises' }} />
      {/* Opened from the Exercises list; TabBar hides it and keeps "Exercises" active. */}
      <Tabs.Screen name="exercise/[name]" options={{ title: 'Exercise' }} />
    </Tabs>
  );
}
