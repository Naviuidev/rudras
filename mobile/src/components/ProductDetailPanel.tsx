import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import RemoteImage from './RemoteImage';
import AppButton from './AppButton';
import ProductGridCard from './ProductGridCard';
import SubscriptionScheduleModal from './SubscriptionScheduleModal';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useServiceArea } from '../context/ServiceAreaContext';
import { useTabBarInset } from '../hooks/useTabBarInset';
import { getProduct, getProducts } from '../services/api';

interface ProductDetailPanelProps {
  product?: any;
  productId?: number;
  onBack: () => void;
  onSelectProduct?: (product: any) => void;
}

function qtyLabel(product: any) {
  if (product.quantity && product.quantity_unit) {
    return `${product.quantity} ${product.quantity_unit}`;
  }
  return product.quantity_unit || '';
}

export default function ProductDetailPanel({ product: initialProduct, productId, onBack, onSelectProduct }: ProductDetailPanelProps) {
  const navigation = useNavigation<any>();
  const { cart, addToCart, updateCartQuantity } = useAuth();
  const requireAuth = useRequireAuth();
  const { ensureServiceArea } = useServiceArea();
  const tabBarInset = useTabBarInset();
  const [product, setProduct] = useState<any>(initialProduct ?? null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(!initialProduct?.name && !!productId);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  useEffect(() => {
    if (initialProduct?.name) {
      setProduct(initialProduct);
      setLoading(false);
      return;
    }
    const id = productId ?? initialProduct?.id;
    if (!id) return;
    setLoading(true);
    getProduct(id)
      .then((res) => setProduct(res.data.data))
      .catch(() => Alert.alert('Error', 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [initialProduct, productId]);

  useEffect(() => {
    if (!product?.category) return;
    getProducts({ category: product.category })
      .then((res) => {
        const items = (res.data.data || []).filter((p: any) => p.id !== product.id).slice(0, 8);
        setRelated(items);
      })
      .catch(() => setRelated([]));
  }, [product?.id, product?.category]);

  if (loading || !product) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading product…</Text>
      </View>
    );
  }

  const basePrice = parseFloat(product.price);
  const price = parseFloat(product.price_after_offer || product.price);
  const hasOffer = product.price_after_offer != null && price < basePrice;
  const discountPct =
    hasOffer && product.offer_percentage && product.offer_percentage > 0
      ? Math.round(product.offer_percentage)
      : hasOffer
        ? Math.round((1 - price / basePrice) * 100)
        : null;
  const isSubscription = product.monthly_subscription === 1;
  const inCart = cart.find((i) => i.product_id === product.id);
  const outOfStock = product.stock != null && product.stock <= 0;
  const categoryName = product.category_name || product.category || 'Products';

  const handleAddToCart = async () => {
    if (!requireAuth({ type: 'checkout' })) return;
    if (outOfStock) return;
    const allowed = await ensureServiceArea();
    if (!allowed) return;
    addToCart({ product_id: product.id, name: product.name, price, image: product.image }, 1);
    Alert.alert('Added', `${product.name} added to cart`, [
      { text: 'Continue', style: 'cancel' },
      { text: 'View Cart', onPress: () => navigation.getParent()?.navigate('Cart') },
    ]);
  };

  const handleDecrease = () => {
    if (inCart) updateCartQuantity(product.id, inCart.quantity - 1);
  };

  const handleIncrease = async () => {
    if (!requireAuth({ type: 'checkout' })) return;
    if (inCart) {
      const allowed = await ensureServiceArea();
      if (!allowed) return;
      updateCartQuantity(product.id, inCart.quantity + 1);
    } else {
      await handleAddToCart();
    }
  };

  const handleSubscribe = () => {
    if (!requireAuth({ type: 'subscriptionCreate' })) return;
    setShowSubscribeModal(true);
  };

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: tabBarInset }]}>
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbMuted}>Home / </Text>
          <Text style={styles.breadcrumbMuted}>{categoryName} / </Text>
          <Text style={styles.breadcrumbCurrent} numberOfLines={1}>{product.name}</Text>
        </View>

        <TouchableOpacity onPress={onBack} style={styles.backRow} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={20} color={COLORS.accent} />
          <Text style={styles.backText}>Back to products</Text>
        </TouchableOpacity>

        <View style={styles.imageWrap}>
          <RemoteImage uri={product.image} label={product.name} style={styles.image} />
        </View>
        <Text style={styles.category}>{categoryName.toUpperCase()}</Text>
        <Text style={styles.name}>{product.name}</Text>
        {qtyLabel(product) ? <Text style={styles.qtyMeta}>{qtyLabel(product)}</Text> : null}
        <Text style={styles.subscriptionTag}>
          Monthly subscription: <Text style={styles.subscriptionTagBold}>{isSubscription ? 'Yes' : 'No'}</Text>
        </Text>

        <View style={styles.priceRow}>
          <View style={styles.priceBlock}>
            <Text style={styles.price}>
              ₹{price.toFixed(2)}
              {isSubscription ? <Text style={styles.perMonth}>/month</Text> : null}
            </Text>
            {hasOffer ? <Text style={styles.strike}>MRP ₹{basePrice.toFixed(2)}</Text> : null}
            {discountPct != null && discountPct > 0 ? (
              <Text style={styles.discountBadge}>{discountPct}% OFF</Text>
            ) : null}
            <Text style={styles.taxNote}>(Inclusive of all taxes)</Text>
            <Text style={[styles.stock, outOfStock ? styles.stockOut : styles.stockIn]}>
              {outOfStock ? 'Out of stock' : 'In stock'}
            </Text>
          </View>

          {!isSubscription && !outOfStock ? (
            inCart ? (
              <View style={styles.qtyControls}>
                <AppButton label="−" small onPress={handleDecrease} />
                <Text style={styles.qty}>{inCart.quantity}</Text>
                <AppButton label="+" small onPress={handleIncrease} />
              </View>
            ) : (
              <AppButton label="Add to cart" small variant="outline" onPress={handleAddToCart} />
            )
          ) : null}
        </View>

        <Text style={styles.description}>{product.description || 'Fresh from our farm.'}</Text>

        {isSubscription && !outOfStock ? (
          <View style={styles.subscribeBlock}>
            <Text style={styles.subscribeStep}>① Product selected — schedule your deliveries below</Text>
            <AppButton
              label="Continue to schedule →"
              variant="accent"
              onPress={handleSubscribe}
              style={styles.action}
            />
          </View>
        ) : null}

        {related.length > 0 ? (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Related products</Text>
            <View style={styles.relatedGrid}>
              {related.map((item) => (
                <View key={item.id} style={styles.relatedCell}>
                  <ProductGridCard product={item} onPress={() => onSelectProduct?.(item)} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <SubscriptionScheduleModal
        visible={showSubscribeModal}
        product={product}
        onClose={() => setShowSubscribeModal(false)}
        onSuccess={() => navigation.navigate('Subscription')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  loadingText: { fontFamily: FONTS.regular, color: COLORS.textLight },
  breadcrumb: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.xs },
  breadcrumbMuted: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textLight },
  breadcrumbCurrent: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.accent, flexShrink: 1 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
  },
  backText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.accent },
  imageWrap: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  category: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textLight,
    letterSpacing: 1,
    marginTop: SPACING.sm,
  },
  name: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text, marginTop: 4 },
  qtyMeta: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  subscriptionTag: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight, marginTop: 6 },
  subscriptionTagBold: { fontFamily: FONTS.semiBold, color: COLORS.text },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  priceBlock: { flex: 1 },
  price: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.accent },
  perMonth: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textLight },
  strike: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  discountBadge: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: '#2e7d32',
    marginTop: 4,
  },
  taxNote: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  stock: { fontFamily: FONTS.medium, fontSize: 12, marginTop: 4 },
  stockIn: { color: '#2e7d32' },
  stockOut: { color: COLORS.error },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qty: { fontFamily: FONTS.bold, fontSize: 18, minWidth: 28, textAlign: 'center' },
  description: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 12,
    lineHeight: 22,
  },
  subscribeBlock: { marginTop: SPACING.lg },
  subscribeStep: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text, marginBottom: SPACING.sm },
  action: { marginTop: SPACING.xs },
  relatedSection: { marginTop: SPACING.xl },
  relatedTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.accent, marginBottom: SPACING.sm },
  relatedGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  relatedCell: { width: '50%', paddingHorizontal: 4, marginBottom: SPACING.sm },
});
