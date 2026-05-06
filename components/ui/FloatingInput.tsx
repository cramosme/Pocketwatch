import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'

interface FloatingInputProps {
  label: string
  value: string
  onChangeText: (text: string) => void
  keyboard?: any
  maxLength?: number
  keyType?: any
  inputRef?: any
  onSubmitEditing?: () => void
  isPassword?: boolean
}

// Text input with a floating label that animates above the field when focused or filled
export default function FloatingInput({ label, value, onChangeText, keyboard, maxLength, keyType, inputRef, onSubmitEditing, isPassword }: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <View
      className={`rounded-sm mt-5 flex-row items-center ${
        isFocused ? 'border-2 border-text_main' : 'border border-inactive_text'
      }`}
    >
      {/* Label floats above the field when focused or filled, bg-background covers the border line */}
      <Text
        className={`absolute left-3 px-1 z-10 bg-background ${
          isFocused || value.length > 0
            ? `-top-3 text-sm ${isFocused ? 'text-text_main' : 'text-inactive_text'}`
            : 'top-5 text-base text-inactive_text'
        }`}
      >
        {label}
      </Text>

      <TextInput
        ref={inputRef}
        onSubmitEditing={onSubmitEditing}
        className="flex-1 p-5 text-base text-text_main font-sans"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboard}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        maxLength={maxLength}
        returnKeyType={keyType}
        secureTextEntry={!!isPassword}
      />
    </View>
  )
}