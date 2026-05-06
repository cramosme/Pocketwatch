import { Stack } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

interface ScreenHeaderProps {
  title: string
  onPress?: () => void
}

// Reusable screen header. Pass onPress to show an info icon on the right
export default function ScreenHeader({ title, onPress }: ScreenHeaderProps) {
  return (
    <Stack.Screen
      options={{
        title,
        headerShown: true,
        headerShadowVisible: false,
        ...(onPress && {
          headerRight: () => (
            <TouchableOpacity onPress={onPress}>
              <MaterialIcons name="info" size={24} />
            </TouchableOpacity>
          ),
        }),
      }}
    />
  )
}