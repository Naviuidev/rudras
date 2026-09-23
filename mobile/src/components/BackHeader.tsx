import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface BackHeaderProps {
  onBack: () => void;
  title?: string;
}

export default function BackHeader({ onBack, title }: BackHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + SPACING.xs }]}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backBtn}
        activeOpacity={0.85}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={22} color={COLORS.accent} />
      </TouchableOpacity>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.titleSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.primary,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: FONTS.semiBold,
    fontSize: 17,
    color: COLORS.accent,
  },
  titleSpacer: { flex: 1 },
});
