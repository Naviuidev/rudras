import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ORDER_STATUS_LABELS, COLORS, FONTS } from '../constants/theme';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f57c00',
  confirmed: '#1976d2',
  packed: '#7b1fa2',
  out_for_delivery: '#0288d1',
  delivered: '#388e3c',
  cancelled: '#d32f2f',
};

interface OrderStatusBadgeProps {
  status: string;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const color = STATUS_COLORS[status] || COLORS.textLight;
  const label = ORDER_STATUS_LABELS[status] || status;

  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontFamily: FONTS.medium, fontSize: 12 },
});
