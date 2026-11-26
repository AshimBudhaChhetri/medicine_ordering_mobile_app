import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useState } from "react";
import {
  Animated,
  KeyboardTypeOptions,
  Pressable,
  ReturnKeyTypeOptions,
  StyleSheet,
  TextInput,
} from "react-native";

import { colors } from "../theme/colors";

export type FloatingLabelInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  isPassword?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  autoComplete?: any;
  textContentType?: any;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  editable?: boolean;
  inputRef?: React.RefObject<TextInput | null>;
  onFocus?: () => void;
  onBlur?: () => void;
};

export function FloatingLabelInput({
  label,
  value,
  onChangeText,
  isPassword = false,
  showPassword = false,
  onTogglePassword,
  keyboardType = "default",
  autoCapitalize = "none",
  autoCorrect = false,
  autoComplete,
  textContentType,
  returnKeyType = "done",
  onSubmitEditing,
  editable = true,
  inputRef,
  onFocus,
  onBlur,
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // 0 = idle inside input, 1 = floating at top border
  const [animatedValue] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || Boolean(value) ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, animatedValue]);

  // Interpolate vertical position: idle (top: 17) -> floating (top: -10)
  const labelTop = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [16, -10],
  });

  // Interpolate font size: idle (14px) -> floating (11px)
  const labelFontSize = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 11],
  });

  // Active label & border colors
  const labelColor = isFocused
    ? colors.primary
    : value
    ? colors.textSecondary
    : colors.textMuted;

  const borderColor = isFocused ? colors.primary : colors.border;

  const handleContainerPress = () => {
    if (editable && inputRef?.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Pressable
      onPress={handleContainerPress}
      style={[
        styles.container,
        { borderColor },
        !editable && styles.containerDisabled,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.labelBadge,
          {
            top: labelTop,
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.labelText,
            {
              fontSize: labelFontSize,
              color: labelColor,
            },
          ]}
        >
          {label}
        </Animated.Text>
      </Animated.View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        placeholder=""
        secureTextEntry={isPassword && !showPassword}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        autoComplete={autoComplete}
        textContentType={textContentType}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        editable={editable}
        style={styles.input}
      />

      {isPassword && onTogglePassword && (
        <Pressable
          onPress={onTogglePassword}
          disabled={!editable}
          hitSlop={12}
          style={styles.toggleButton}
        >
          <MaterialCommunityIcons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={colors.textMuted}
          />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    overflow: "visible",
  },
  containerDisabled: {
    opacity: 0.65,
  },
  labelBadge: {
    position: "absolute",
    left: 12,
    backgroundColor: colors.card,
    paddingHorizontal: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  labelText: {
    fontWeight: "500",
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: colors.text,
    fontWeight: "400",
    paddingVertical: 0,
  },
  toggleButton: {
    marginLeft: 6,
    padding: 4,
  },
});
