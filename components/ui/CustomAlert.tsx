import { ReactNode } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

interface CustomAlertProps {
  message: string | ReactNode
  visible: boolean
  onClose: () => void
  confirmText?: string
  onConfirm?: () => void
}

// Custom alert using Views instead of the native Alert module
// Gives consistent styling across iOS and Android
export default function CustomAlert({ message, visible, onClose, confirmText, onConfirm }: CustomAlertProps) {
  if (!visible) return null

  return (
    <View className="absolute inset-0 flex-1 justify-center items-center bg-black/50 px-6" style={{ zIndex: 999 }}>
      <View className="bg-zinc-600 p-6 rounded-lg">
        <Text className="text-white text-lg leading-normal">{message}</Text>

        <View className="items-end flex-row justify-end gap-4 pt-4">
          {/* Show two buttons if confirm action provided, otherwise single OK */}
          {onConfirm && confirmText ? (
            <>
              <TouchableOpacity onPress={onClose} className="px-2">
                <Text className="text-gray-400 text-base font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { onClose(); onConfirm() }} className="px-2">
                <Text className="text-white text-base font-bold">{confirmText}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={onClose} className="px-2">
              <Text className="text-white text-base font-bold">OK</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}