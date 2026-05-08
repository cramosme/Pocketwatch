import { supabase } from "@/lib/supabase"
import { TouchableOpacity, Text } from "react-native"

export default function Home() { 
  
  return (
    // Temp logout button for testing auth
    <TouchableOpacity className="flex-1 justify-center" onPress={() => supabase.auth.signOut()}>
      <Text className="text-danger text-center">Logout</Text>
    </TouchableOpacity>
  );

}
