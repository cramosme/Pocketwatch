import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import FloatingInput from '@/components/ui/FloatingInput';
import Entypo from "@expo/vector-icons/Entypo";
import BrandHeader from "@/components/ui/BrandHeader";

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [confirmationIsVisible, setConfirmationIsVisible] = useState(false);

  // useRef so that we can wire the next button
  // Need references to email, password and confirm password as those are the boxes we move to
  // Tell it type is of <TextInput> so that typescript doesnt complain about it not having a type
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  // Calls the supabase auth function passing the email,password pair
  // On error use our customError function to better word the messages
  const handleSignup = async() => {
    setLoading(true);
    setError(null);

    try{

      // Pass the name as metadata alongside the credentials
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email, 
        password: password,
        options: {
          data: { name },
        },
      });
  
      if ( signupError ){
        setError("Failed to create account. Please try again.");
        return;
      }

      // Upsert the name into accounts table using new user's id
      if( data.user ){
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({id: data.user.id, name});

        if( profileError ){
          setError("Account created but failed to save name.");
        }
      }

      //AuthProvider handles redirect on session change, no need to include here
    } catch( err: any ){
      setError(err instanceof Error ? err.message : "Something went wrong"); // catch unexpected errors
    }
    finally{
      // Always run regardless of succcess or failure
      setLoading(false);
    }
  };

  // REGEX to check whether the user typed something we consider valid email format
  // Checks: "1 or more
  // characters" @ "1 or more characters" . "1 or more characters"
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Use REGEX to verify that the user only entered digits and that they meet the length requirements
  const validPassword = (password: string) => {
    // Check the length of the password first
    if (password.length < 8 || password.length > 64) return false;

    // We set 4 minimum requirements, use this counter to see how many the user abides by.
    let abidedBy = 0;

    if (/[a-z]/.test(password)) abidedBy++; // Check for lowercase
    if (/[A-Z]/.test(password)) abidedBy++; // Check for uppercase
    if (/\d/.test(password)) abidedBy++; // Check for number
    if (/[^a-zA-Z\d\s]/.test(password)) abidedBy++; // Check for symbol

    // Check if they hit all 4 requirements
    return abidedBy === 4;
  };

  // boolean to determine whether one - the password matches our criteria and two - both passwords entered match. Either keeps next button disabled if not correct or allows user to proceed.
  const isReady = validPassword(password) && password === confirmPassword && validEmail;

  // Requirements array to reduce repeated code. Map through each req
  // Each requirement is a label paired with a boolean check against current password
  // Will recheck everytime a character is typed/deleted
  // Recheck happens on top of the password state changing, so no extra cost
  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "At least 1 number", met: /\d/.test(password) },
    { label: "At least 1 lowercase", met: /[a-z]/.test(password) },
    { label: "At least 1 uppercase", met: /[A-Z]/.test(password) },
    { label: "At least 1 special character", met: /[^a-zA-Z\d\s]/.test(password) },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background justify-center px-6">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          className="flex-1"
          showsVerticalScrollIndicator={false}
        >
          
          <BrandHeader />

          {/* Name, Email and password inputs */}

          <FloatingInput
            label="What should we call you?"
            value={name}
            onChangeText={setName}
            keyboard="default"
            autoCapitalize="words"
            keyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <FloatingInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboard="email-address"
            keyType="next"
            inputRef={emailRef}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          {!validEmail && email.length > 0 &&(
            <Text className="text-danger mt-2 font-sans text-sm">
              Please enter a valid email address
            </Text>
          )}

          <FloatingInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            onFocusChange={setPasswordFocused}
            keyboard="default"
            isPassword={!isVisible} // If its not visible then that means it is a password. Used to control visibility via icon
            keyType="next"
            inputRef={passwordRef}
            onSubmitEditing={() => confirmRef.current?.focus()}
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

          {/* Show password requirements if the field is active */}
          {passwordFocused && (
            <Text className="text-base mt-2 font-sans text-inactive_text">
              Password must contain:
            </Text>
          )}
          {passwordFocused && (
            <View className="flex-row flex-wrap justify-between">
              { requirements.map((req) => (
                <Text
                  key={req.label}
                  className={`text-base font-sans ${
                    req.met ? "text-success" : "text-inactive_text"
                  }`}
                >
                  { req.met ? "   ✅" : "   \u2022"} {req.label}
                </Text>
              ))}
            </View>
          )}

          <FloatingInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            keyboard="default"
            isPassword={!confirmationIsVisible}
            inputRef={confirmRef}
            onSubmitEditing={ isReady ? handleSignup : () => {} } // If it's not ready, done wont make call since we know it will fail
            alertIcon={
              <TouchableOpacity
                onPress={() => setConfirmationIsVisible(!confirmationIsVisible)}
                className="p-4"
              >
                <Entypo
                  name={confirmationIsVisible ? "eye-with-line" : "eye"}
                  size={24}
                  color="#A0B3D3"
                />
              </TouchableOpacity>
            }
          />

          {/* Show mismatch warning as soon as confirm password has any value */}
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <Text className="text-danger mt-2 font-sans text-sm">
              Passwords do not match
            </Text>
          )}

          {/* Conditionally render the error message, however we define empty string as else to reserve space on page */}
          <View className="flex-row justify-between gap-3">
            <Text className="text-danger mt-4 font-sans flex-1 text-wrap text-base">
              {error ? error : " "}
            </Text>
          </View>

          <TouchableOpacity
            className={`rounded-lg py-4 items-center mt-6 mb-4 ${
              isReady && !loading ? "bg-accent" : "bg-accent/50"
            }`}
            onPress={handleSignup}
            disabled={!isReady || loading}
          >
            {loading
              ? <ActivityIndicator color="#F7FDFD" />
              : <Text className="text-background font-semibold text-xl">Sign Up</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text className="text-center text-accent font-sans text-base">
              Already have an account? Log In
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}