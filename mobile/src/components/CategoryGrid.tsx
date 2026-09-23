import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import RemoteImage from './RemoteImage';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import type { CategoryDisplayItem } from '../utils/categoryDisplay';

interface CategoryGridProps {
  categories: CategoryDisplayItem[];
  title?: string;
  selectedSlug?: string;
  onSelect?: (category: CategoryDisplayItem) => void;
}

export default function CategoryGrid({
  categories,
  title = 'Categories',
  selectedSlug = '',
  onSelect,
}: CategoryGridProps) {
  const { width } = useWindowDimensions();
  const columns = width >= 768 ? 6 : width >= 400 ? 4 : 3;
  const tileSize = Math.min(110, (width - SPACING.md * 2 - (columns - 1) * 8) / columns - 40);

  if (!categories.length) return null;

  return (
    <View style={styles.section}>
      {title ? <Text style={styles.heading}>{title}</Text> : null}
      <View style={styles.grid}>
        {categories.map((cat) => {
          const active = selectedSlug === cat.slug;
          return (
            <TouchableOpacity
              key={cat.slug}
              style={[styles.item, { width: `${100 / columns}%` as any }]}
              onPress={() => onSelect?.(cat)}
              activeOpacity={0.85}
            >
              <View style={[styles.tile, { width: tileSize, height: tileSize }, active && styles.tileActive]}>
                {cat.image ? (
                  <RemoteImage uri={cat.image} label={cat.name} style={styles.image} />
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: SPACING.lg, paddingHorizontal: SPACING.md },
  heading: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    minWidth: '30%',
  },
  tile: {
    borderRadius: 24,
    backgroundColor: '#f0f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  tileActive: { borderWidth: 2, borderColor: COLORS.accent },
  image: { width: '85%', height: '85%' },
  icon: { fontSize: 32 },
  label: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 16,
  },
  labelActive: { color: COLORS.accent, fontFamily: FONTS.semiBold },
});
