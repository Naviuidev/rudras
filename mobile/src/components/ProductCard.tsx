import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RemoteImage from './RemoteImage';
import { COLORS, FONTS, BORDER_RADIUS, SPACING } from '../constants/theme';

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  category: string;
}

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onAddToCart?: () => void;
  compact?: boolean;
}

export default function ProductCard({ product, onPress, onAddToCart, compact }: ProductCardProps) {
  return (
    <TouchableOpacity style={[styles.card, compact && styles.compact]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.imageWrap, compact && styles.compactImageWrap]}>
        <RemoteImage
          uri={product.image}
          label={product.name}
          style={styles.image}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>₹{product.price}</Text>
        {onAddToCart && (
          <TouchableOpacity style={styles.addButton} onPress={onAddToCart}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: BORDER_RADIUS,
    width: 160,
    marginRight: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  compact: { width: '48%' as any, marginRight: 0, marginBottom: SPACING.md },
  imageWrap: {
    width: '100%',
    height: 120,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactImageWrap: { height: 100 },
  image: { width: '100%', height: '100%' },
  info: { padding: SPACING.sm, position: 'relative' },
  name: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text, marginBottom: 4 },
  price: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.accent },
  addButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: COLORS.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
