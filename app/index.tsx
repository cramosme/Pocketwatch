import { useAuth } from "@/components/shared/AuthProvider";
import { Redirect } from "expo-router";


// Redirect based on auth state
export default function Index() {

  const { session, loading } = useAuth();

  if( loading ) return null;

  return <Redirect href={session ? "/(tabs)/home" : "/(auth)/login"} />
}
