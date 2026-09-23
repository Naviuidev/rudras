import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONTS, BORDER_RADIUS, SPACING } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
}

export default function Card({ children, style, title }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
});
