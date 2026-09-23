import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import RemoteImage from './RemoteImage';
import AppButton from './AppButton';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useServiceArea } from '../context/ServiceAreaContext';

interface ProductGridCardProps {
  product: {
    id: number;
    name: string;
    price: number;
    price_after_offer?: number | string | null;
    offer_percentage?: number | null;
    image?: string;
    stock?: number;
    quantity?: number | string | null;
    quantity_unit?: string | null;
    monthly_subscription?: number;
  };
  onPress?: () => void;
}

export default function ProductGridCard({ product, onPress }: ProductGridCardProps) {
  const { cart, addToCart, updateCartQuantity } = useAuth();
  const { ensureServiceArea } = useServiceArea();

  const basePrice = parseFloat(String(product.price));
  const displayPrice = product.price_after_offer != null
    ? parseFloat(String(product.price_after_offer))
    : basePrice;
  const hasOffer = product.price_after_offer != null && displayPrice < basePrice;
  const inCart = cart.find((i) => i.product_id === product.id);
  const outOfStock = product.stock != null && product.stock <= 0;
  const isSubscription = product.monthly_subscription === 1;

  const qtyLabel =
    product.quantity && product.quantity_unit
      ? `${product.quantity} ${product.quantity_unit}`
      : product.quantity_unit || '1 pc';

  const discountLabel =
    hasOffer && product.offer_percentage && product.offer_percentage > 0
      ? `${Math.round(product.offer_percentage)}% OFF`
      : hasOffer
        ? `${Math.round((1 - displayPrice / basePrice) * 100)}% OFF`
        : null;

  const handleAdd = async () => {
    if (outOfStock || isSubscription) return;
    const allowed = await ensureServiceArea();
    if (!allowed) return;
    addToCart(
      { product_id: product.id, name: product.name, price: displayPrice, image: product.image },
      1
    );
  };

  const handleIncrease = async () => {
    if (!inCart) return;
    const allowed = await ensureServiceArea();
    if (!allowed) return;
    updateCartQuantity(product.id, inCart.quantity + 1);
  };

  const handleDecrease = () => {
    if (inCart) updateCartQuantity(product.id, inCart.quantity - 1);
  };

  return (
    <View style={styles.card}>
      {discountLabel ? <Text style={styles.discount}>{discountLabel}</Text> : null}

      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={styles.imageWrap}>
          <RemoteImage uri={product.image} label={product.name} style={styles.image} />
        </View>
        <View style={styles.delivery}>
          <Text style={styles.deliveryIcon}>⏱</Text>
          <Text style={styles.deliveryText}>8 MINS</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.qtyText}>{qtyLabel}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <View style={styles.priceCol}>
          <Text style={styles.price}>₹{displayPrice.toFixed(0)}</Text>
          {hasOffer ? <Text style={styles.mrp}>₹{basePrice.toFixed(0)}</Text> : null}
        </View>

        {isSubscription ? (
          <AppButton label="Subscribe" small variant="outline" onPress={onPress} />
        ) : outOfStock ? (
          <Text style={styles.oos}>Out of stock</Text>
        ) : inCart ? (
          <View style={styles.qtyControl}>
            <AppButton label="−" small onPress={handleDecrease} />
            <Text style={styles.qtyVal}>{inCart.quantity}</Text>
            <AppButton label="+" small onPress={handleIncrease} />
          </View>
        ) : (
          <AppButton label="ADD" small variant="outline" onPress={handleAdd} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#ebebeb',
    borderRadius: 10,
    padding: 8,
    minHeight: 220,
    position: 'relative',
  },
  discount: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 2,
    backgroundColor: '#4a90e2',
    color: '#fff',
    fontSize: 9,
    fontFamily: FONTS.bold,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  delivery: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  deliveryIcon: { fontSize: 10 },
  deliveryText: { fontFamily: FONTS.medium, fontSize: 10, color: '#777' },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 16,
    minHeight: 32,
  },
  qtyText: { fontFamily: FONTS.regular, fontSize: 11, color: '#888', marginBottom: 6 },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' },
  priceCol: { flex: 1 },
  price: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.text },
  mrp: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  oos: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.error },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyVal: { fontFamily: FONTS.bold, fontSize: 13, minWidth: 16, textAlign: 'center' },
});
