import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from 'expo-router';
import { AuthProvider, useAuth } from '../components/shared/AuthProvider';
import '../globals.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync(); // keep splash screen up while fonts load

// Create the client outside the component so it isn't recreated on every render
const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Watches font loaded and once it is fully loaded then it hides the splash screen
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          {/* AppEntry is a separate component so useAuth can consume AuthProvider above it */}
          <AppEntry />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function AppEntry() {
  const { session, loading } = useAuth();

  // Redirect based on session state once auth check is complete
  useEffect(() => {
    if (loading) return;
    if (session) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/(auth)/login');
    }
  }, [session, loading]);

  return (
    // headerShown false; each screen manages its own header
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="transactions/index" />
      <Stack.Screen name="transactions/[id]" />
      <Stack.Screen name="whatif/index" />
    </Stack>
  );
}