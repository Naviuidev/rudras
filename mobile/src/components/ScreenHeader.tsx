import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function ScreenHeader({ title, subtitle, onBack, rightAction }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + SPACING.sm }]}>
      <View style={styles.row}>
        {onBack ? (
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
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.right}>{rightAction}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
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
  backPlaceholder: { width: 40 },
  titles: { flex: 1, paddingHorizontal: SPACING.sm },
  title: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.accent },
  subtitle: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  right: { minWidth: 40, alignItems: 'flex-end' },
});
