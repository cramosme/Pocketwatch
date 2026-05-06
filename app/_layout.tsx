import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { AuthProvider, useAuth } from '../components/shared/AuthProvider'
import '../globals.css'

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* AppEntry is a separate component so useAuth can consume AuthProvider above it */}
      <AppEntry />
    </AuthProvider>
  )
}

function AppEntry() {
  const { session, loading } = useAuth()

  // Redirect based on session state once auth check is complete
  useEffect(() => {
    if (loading) return
    if (session) {
      router.replace('/(tabs)/home')
    } else {
      router.replace('/(auth)/login')
    }
  }, [session, loading])

  return (
    // headerShown false; each screen manages its own header
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="transactions/index" />
      <Stack.Screen name="transactions/[id]" />
      <Stack.Screen name="whatif/index" />
    </Stack>
  )
}