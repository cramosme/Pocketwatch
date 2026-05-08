import { Tabs } from 'expo-router'

// Bottom tab navigator — main app navigation
export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="envelopes" />
      <Tabs.Screen name="transfers" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}