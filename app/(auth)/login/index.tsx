import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import FloatingInput from '@/components/ui/FloatingInput';
import Entypo from "@expo/vector-icons/Entypo";
import BrandHeader from "@/components/ui/BrandHeader";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Create custom messages based on what is returned as an error from supabase
  const customError = (message: string): string => {
    if(message.includes("missing email or phone")){
      return "Email address is required"
    }
    if(message.includes("Invalid login credentials")){
      return "Incorrect email or password";
    }
    return "Something went wrong. Please try again";
  }

  // Calls the supabase auth function passing the email,password pair
  // On error use our customError function to better word the messages
  const handleLogin = async() => {
    setLoading(true);
    setError(null);

    try{

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error){
        setError(customError(error.message));
      }

    } catch ( err: unknown ){ // Catch any unexpected errors
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    }
    finally{
      // No redirect needed. AuthProvider detects session change and _layout.tsx handles it
      setLoading(false)

    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background justify-center px-6">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* This app logo and name */}
        <BrandHeader size={300} />

        {/* Tagline */}
        <Text className="text-inactive_text text-xs tracking-widest text-center" style={{ marginTop: -20 }}>
          STOP WATCHING
          <Text className="text-danger">
            {' '}THEIRS.
          </Text>
            {' '}WATCH
          <Text className="text-success">
            {' '}YOURS.
          </Text>
        </Text>

        {/* Email and password inputs */}
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
          keyboard="default"
          isPassword={!isVisible} // If its not visible then that means it is a password. Used to control visibility via icon
          keyType="done"
          onSubmitEditing={handleLogin}
          alertIcon={
              <TouchableOpacity
                onPress={() => setIsVisible(!isVisible)}
                className="p-4"
              >
                <Entypo
                  name={isVisible ? "eye-with-line" : "eye"}
                  size={24}
                  color="#A0B3D3"
                />
              </TouchableOpacity>
          }
        />

        {/* Conditionally render the error message, however we define empty string as else to reserve space on page */}
        <View className="flex-row justify-between gap-3">
          <Text className="text-danger mt-4 font-sans flex-1 text-wrap text-base">
            {error ? error : " "}
          </Text>
          <TouchableOpacity
            className="mt-4"
            onPress={() => router.replace("/(auth)/resetPassword")}
          >
            <Text className="text-right font-sans text-inactive_text flex-shrink-0 text-base">
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="bg-accent rounded-lg py-4 items-center mt-6 mb-4"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#F7FDFD" />
            : <Text className="text-background font-semibold text-xl">Log In</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
          <Text className="text-center text-accent font-sans text-base">
            {"Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}