import { useState } from 'react'
import { Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import FloatingInput from '@/components/ui/FloatingInput'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) setError(error.message)

    // No redirect needed. AuthProvider detects session change and _layout.tsx handles it
    setLoading(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-background justify-center px-6">
      <Text className="text-3xl font-bold text-text_main mb-2">Pocketwatch</Text>
      <Text className="text-inactive_text mb-8 font-sans">Stop watching theirs. Watch yours.</Text>

      {error && (
        <Text className="text-danger mb-4">{error}</Text>
      )}

      <FloatingInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboard="email-address"
        keyType="next"
      />

      <FloatingInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        isPassword
        keyType="done"
        onSubmitEditing={handleLogin}
      />

      <TouchableOpacity
        className="bg-accent rounded-lg py-4 items-center mt-8 mb-4"
        onPress={handleLogin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#F7FDFD" />
          : <Text className="text-background font-semibold">Log In</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
        <Text className="text-center text-accent font-sans">
          Don't have an account? Sign Up
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}