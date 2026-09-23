import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import RemoteImage from './RemoteImage';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import type { CategoryDisplayItem } from '../utils/categoryDisplay';

interface CategorySidebarProps {
  categories: CategoryDisplayItem[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}

export default function CategorySidebar({ categories, selectedSlug, onSelect }: CategorySidebarProps) {
  if (!categories.length) return null;

  return (
    <View style={styles.sidebar}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.nav}>
        {categories.map((cat) => {
          const active = selectedSlug === cat.slug;
          return (
            <TouchableOpacity
              key={cat.slug}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => onSelect(cat.slug)}
              activeOpacity={0.85}
            >
              <View style={[styles.thumb, active && styles.thumbActive]}>
                {cat.image ? (
                  <RemoteImage uri={cat.image} label={cat.name} style={styles.thumbImg} />
                ) : (
                  <Text style={styles.icon}>{cat.icon}</Text>
                )}
              </View>
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={2}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 88,
    backgroundColor: '#eef5e8',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  nav: { paddingVertical: SPACING.sm },
  item: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  itemActive: {
    backgroundColor: COLORS.primary,
    borderLeftColor: COLORS.accent,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 4,
  },
  thumbActive: { backgroundColor: COLORS.white },
  thumbImg: { width: 40, height: 40 },
  icon: { fontSize: 24 },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 13,
  },
  labelActive: { color: COLORS.accent, fontFamily: FONTS.semiBold },
});
