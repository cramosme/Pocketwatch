import { Stack } from 'expo-router'

// Stack navigator for auth screens — no bottom tab bar
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}