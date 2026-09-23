import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

type AppButtonVariant = 'outline' | 'accent' | 'ghost';

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function AppButton({
  label,
  onPress,
  variant = 'outline',
  disabled = false,
  loading = false,
  small = false,
  style,
  textStyle,
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        small && styles.small,
        variant === 'outline' && styles.outline,
        variant === 'accent' && styles.accent,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'accent' ? '#fff' : COLORS.accent} />
      ) : (
        <Text
          style={[
            styles.text,
            small && styles.textSmall,
            variant === 'outline' && styles.textOutline,
            variant === 'accent' && styles.textAccent,
            variant === 'ghost' && styles.textGhost,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  accent: {
    backgroundColor: COLORS.accent,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  disabled: { opacity: 0.55 },
  text: { fontFamily: FONTS.semiBold, fontSize: 15 },
  textSmall: { fontSize: 13 },
  textOutline: { color: COLORS.accent },
  textAccent: { color: '#fff' },
  textGhost: { color: COLORS.accent },
});
