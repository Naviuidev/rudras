import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import RemoteImage from '../components/RemoteImage';
import AppButton from '../components/AppButton';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTabBarInset } from '../hooks/useTabBarInset';

const MAX_QTY = 99;

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const { cart, cartTotal, updateCartQuantity, removeFromCart } = useAuth();
  const requireAuth = useRequireAuth();
  const tabBarInset = useTabBarInset();

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.thumb}>
        <RemoteImage uri={item.image} label={item.name} style={styles.thumbImage} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.unitPrice}>₹{item.price.toFixed(2)}</Text>
        <View style={styles.qtyRow}>
          <AppButton label="−" small onPress={() => updateCartQuantity(item.product_id, item.quantity - 1)} />
          <Text style={styles.qty}>{item.quantity}</Text>
          <AppButton
            label="+"
            small
            onPress={() => {
              if (item.quantity < MAX_QTY) updateCartQuantity(item.product_id, item.quantity + 1);
            }}
          />
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.lineTotal}>₹{(item.price * item.quantity).toFixed(2)}</Text>
        <AppButton label="×" small variant="ghost" onPress={() => removeFromCart(item.product_id)} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Shopping Cart" subtitle={`${cart.length} item${cart.length === 1 ? '' : 's'}`} />

      {cart.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add fresh dairy products to get started</Text>
          <AppButton label="Browse Products" variant="accent" onPress={() => navigation.navigate('Products')} />
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => String(item.product_id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
          <View style={[styles.summary, { paddingBottom: tabBarInset }]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{cartTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryMuted}>Delivery</Text>
              <Text style={styles.summaryMuted}>₹0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{cartTotal.toFixed(2)}</Text>
            </View>
            <AppButton
              label="Proceed to Checkout"
              variant="accent"
              onPress={() => {
                if (requireAuth({ type: 'checkout' })) {
                  navigation.navigate('Checkout');
                }
              }}
              style={styles.checkoutBtn}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9f6' },
  list: { padding: SPACING.md, paddingBottom: SPACING.lg },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  info: { flex: 1 },
  name: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  unitPrice: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  qty: { fontFamily: FONTS.semiBold, fontSize: 15, minWidth: 20, textAlign: 'center' },
  right: { alignItems: 'flex-end', gap: 8 },
  lineTotal: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.accent },
  summary: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text },
  summaryValue: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
  summaryMuted: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  totalLabel: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text },
  totalValue: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.accent },
  checkoutBtn: { marginTop: SPACING.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.sm },
  emptyIcon: { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
  emptyText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginBottom: SPACING.md },
});
