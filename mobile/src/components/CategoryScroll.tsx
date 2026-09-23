import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import RemoteImage from './RemoteImage';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import type { CategoryDisplayItem } from '../utils/categoryDisplay';

interface CategoryScrollProps {
  categories: CategoryDisplayItem[];
  onSelect?: (category: CategoryDisplayItem) => void;
}

export default function CategoryScroll({ categories, onSelect }: CategoryScrollProps) {
  if (!categories.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Categories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.slug}
            style={styles.item}
            onPress={() => onSelect?.(cat)}
            activeOpacity={0.85}
          >
            <View style={styles.thumb}>
              {cat.image ? (
                <RemoteImage uri={cat.image} label={cat.name} style={styles.thumbImg} />
              ) : (
                <Text style={styles.icon}>{cat.icon}</Text>
              )}
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: SPACING.md },
  heading: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  scroll: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  item: { alignItems: 'center', width: 72 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f0f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbImg: { width: 48, height: 48 },
  icon: { fontSize: 26 },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 14,
  },
});
