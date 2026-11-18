import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { useWelcome } from '@/hooks/useWelcome';

export default function TabsLayout() {
  const { seen } = useWelcome();
  // First launch only: show the splash before any tab (no flash of Today first).
  if (!seen) return <Redirect href="/welcome" />;

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="week" options={{ title: 'Week' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="exercises" options={{ title: 'Exercises' }} />
    </Tabs>
  );
}
