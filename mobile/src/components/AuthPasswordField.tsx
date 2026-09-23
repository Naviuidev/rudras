import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface AuthPasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function AuthPasswordField({ label, value, onChange, placeholder }: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={!visible}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setVisible((v) => !v)} hitSlop={8}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: SPACING.md },
  label: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#fafafa',
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.text,
  },
});
