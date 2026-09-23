import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import type { ShopType } from '../utils/productShop';

interface ShopTypeToggleProps {
  value: ShopType;
  onChange: (type: ShopType) => void;
}

export default function ShopTypeToggle({ value, onChange }: ShopTypeToggleProps) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      <TouchableOpacity
        style={[styles.btn, value === 'subscription' && styles.btnActive]}
        onPress={() => onChange('subscription')}
        accessibilityRole="tab"
        accessibilityState={{ selected: value === 'subscription' }}
      >
        <Text style={[styles.btnText, value === 'subscription' && styles.btnTextActive]}>Subscriptions</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, value === 'one_time' && styles.btnActive]}
        onPress={() => onChange('one_time')}
        accessibilityRole="tab"
        accessibilityState={{ selected: value === 'one_time' }}
      >
        <Text style={[styles.btnText, value === 'one_time' && styles.btnTextActive]}>One time delivery</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: '#f0f2ed',
    borderRadius: BORDER_RADIUS,
    padding: 3,
    marginHorizontal: SPACING.sm,
    marginTop: SPACING.sm,
    gap: 3,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS - 2,
    alignItems: 'center',
  },
  btnActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  btnText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textLight },
  btnTextActive: { fontFamily: FONTS.semiBold, color: COLORS.accent },
});
