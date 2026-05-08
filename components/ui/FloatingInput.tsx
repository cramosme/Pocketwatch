import { ReactNode, RefObject, useState } from 'react'
import { KeyboardTypeOptions, ReturnKeyTypeOptions, Text, TextInput, View } from 'react-native'

interface FloatingInputProps {
  label: string
  value: string
  onChangeText: (text: string) => void
  keyboard?: KeyboardTypeOptions
  maxLength?: number
  keyType?: ReturnKeyTypeOptions
  alertIcon?:ReactNode
  inputRef?: RefObject<TextInput | null>
  onSubmitEditing?: () => void
  isPassword?: boolean
  onFocusChange?: (focused: boolean) => void
  autoCapitalize?: "none" | "sentences" | "words" | "characters"
}

// Text input with a floating label that animates above the field when focused or filled
export default function FloatingInput({ label, value, onChangeText, keyboard, maxLength, keyType, alertIcon, inputRef, onSubmitEditing, isPassword, onFocusChange, autoCapitalize }: FloatingInputProps) {
  
  // Track the focus of the component
  const [isFocused, setIsFocused] = useState(false)

  return (
    <View
      className={`rounded-sm mt-5 flex-row ${
        isFocused ? 'border-2 border-text_main' : 'border border-inactive_text'
      }`}
    >
      {/* Label floats above the field when focused or filled, bg-background covers the border line */}
      <Text
        className={`absolute left-3 px-1 z-10 bg-background ${
          isFocused || value.length > 0
            ? `-top-3 text-sm ${isFocused ? 'text-text_main' : 'text-inactive_text'}` // Color of the text is based on it being focused alone
            : 'top-5 text-base text-inactive_text'
        }`}
      >
        {label}
      </Text>

      <TextInput
        ref={inputRef}
        onSubmitEditing={onSubmitEditing}
        className={`flex-1 px-5 text-base font-sans ${
          isFocused ? 'text-text_main' : 'text-inactive_text'
        }`}
        textAlignVertical="center"
        style={{
          lineHeight: 20,
          height: 56
        }}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize ?? "none"}
        autoCorrect={false}
        keyboardType={keyboard}
        onFocus={() => {
          setIsFocused(true);
          onFocusChange?.(true);
        }}
        onBlur={() => {
          setIsFocused(false);
          onFocusChange?.(false);
        }}
        maxLength={maxLength}
        returnKeyType={keyType}
        secureTextEntry={!!isPassword}
      />

      {alertIcon}

    </View>
  );
}