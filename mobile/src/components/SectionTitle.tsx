import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import AppButton from './AppButton';

interface SectionTitleProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionTitle({ title, actionLabel, onAction }: SectionTitleProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} small />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
});
