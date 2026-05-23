import { supabase } from "@/lib/supabase";
import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import CustomAlert from "@/components/ui/CustomAlert";
import FloatingInput from "@/components/ui/FloatingInput";
import { useRouter } from "expo-router";
import BrandHeader from "@/components/ui/BrandHeader";

export default function ResetPassword(){

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  // REGEX to check whether the user typed something we consider valid email format
  // Checks: "1 or more characters" @ "1 or more characters" . "1 or more characters"
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleReset = async() => {
    setLoading(true);
    setError(null);

    try{

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if( error ){
        setError("Something went wrong. Please try again.");
        return;
      }

      // if successful reset value
      setEmail("");

      // Render custom alert on success
      setShowSuccess(true);

    } catch (err: unknown){
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } 
    finally{
      setLoading(false);
    }
  };

  return (

    <SafeAreaView className="flex-1 bg-background justify-center px-6">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <BrandHeader />

        <Text className="text-text_main font-sans text-xl mt-4">
          Please enter your information:
        </Text>

        <FloatingInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboard={"email-address"}
          keyType="done"
          onSubmitEditing={ validEmail ? handleReset : undefined }
        />

        {/* Button disabled until user enters valid email */}
        <TouchableOpacity
          disabled={!validEmail || loading}
          className={`mt-6 rounded-lg items-center py-4 ${
            validEmail && !loading ? "bg-accent" : "bg-accent/50"
          }`}
          onPress={handleReset}
        >
          {loading
            ? <ActivityIndicator color="#F7FDFD" />
            : <Text className="text-background font-semibold text-xl">Reset Password</Text>
          }
        </TouchableOpacity>

        {error && (
          <Text className="text-danger font-sans text-center mt-3">
            {error}
          </Text>
        )}

        {/* This will only render if was successful. Hitting ok redirects to login */}
        <CustomAlert
          message={
            <Text>
              If an account exists for that email, a reset link has been sent.
            </Text>
          }
          visible={showSuccess}
          onClose={() => {
            setShowSuccess(false);
            router.replace("/(auth)/login");
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}