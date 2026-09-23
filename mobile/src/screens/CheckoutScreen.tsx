import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import AppButton from '../components/AppButton';
import AddAddressModal from '../components/AddAddressModal';
import CheckoutDeliveryConfirmModal from '../components/CheckoutDeliveryConfirmModal';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getAddresses,
  createAddress,
  checkServiceArea,
  placeOrder,
  initiatePayment,
  verifyPayment,
  getErrorMessage,
} from '../services/api';
import type { Address, AddressInput, AddressServiceStatus } from '../types/address';
import { formatAddressLine } from '../utils/addressLocation';

function statusBadge(status?: AddressServiceStatus) {
  switch (status) {
    case 'serviceable':
      return { text: 'Deliver here', color: '#2e7d32', bg: '#e8f5e9' };
    case 'unserviceable':
      return { text: 'Not serviceable', color: '#c62828', bg: '#fdeaea' };
    case 'checking':
      return { text: 'Checking…', color: COLORS.textLight, bg: '#f5f5f5' };
    default:
      return { text: 'Not verified', color: '#8a6d00', bg: '#fff8e1' };
  }
}

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const { cart, cartTotal, clearCart, isAuthenticated } = useAuth();
  const requireAuth = useRequireAuth();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);
  const FOOTER_HEIGHT = 76;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [serviceStatus, setServiceStatus] = useState<Record<number, AddressServiceStatus>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [highlightAddressId, setHighlightAddressId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const evaluateAddresses = useCallback(async (list: Address[]) => {
    if (list.length === 0) {
      setServiceStatus({});
      return;
    }

    const initial: Record<number, AddressServiceStatus> = {};
    list.forEach((address) => {
      initial[address.id] = address.lat != null && address.lng != null ? 'checking' : 'unknown';
    });
    setServiceStatus(initial);

    const results = await Promise.all(
      list.map(async (address) => {
        if (address.lat == null || address.lng == null) {
          return { id: address.id, status: 'unknown' as const };
        }
        try {
          const res = await checkServiceArea(Number(address.lat), Number(address.lng));
          return {
            id: address.id,
            status: (res.data.data.in_service_area ? 'serviceable' : 'unserviceable') as AddressServiceStatus,
          };
        } catch {
          return { id: address.id, status: 'unknown' as const };
        }
      })
    );

    setServiceStatus((prev) => {
      const next = { ...prev };
      results.forEach(({ id, status }) => {
        next[id] = status;
      });
      return next;
    });
  }, []);

  const loadAddresses = useCallback(async () => {
    try {
      const res = await getAddresses();
      const list = res.data.data || [];
      setAddresses(list);
      await evaluateAddresses(list);
    } catch {
      setAddresses([]);
    }
  }, [evaluateAddresses]);

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth({ type: 'checkout' });
      navigation.replace('CartMain');
      return;
    }
    if (cart.length === 0) {
      navigation.replace('CartMain');
      return;
    }
    loadAddresses().finally(() => setLoading(false));
  }, [cart.length, navigation, isAuthenticated, requireAuth, loadAddresses]);

  const serviceableAddresses = addresses.filter((a) => serviceStatus[a.id] === 'serviceable');
  const multipleServiceable = serviceableAddresses.length > 1;
  const needsDeliveryChoice = multipleServiceable && selectedId == null;
  const canPay =
    addresses.length > 0 &&
    serviceableAddresses.length > 0 &&
    (multipleServiceable || (selectedId != null && serviceStatus[selectedId] === 'serviceable'));

  useEffect(() => {
    if (addresses.length === 0) return;

    const stillChecking = addresses.some(
      (address) => serviceStatus[address.id] === 'checking' || serviceStatus[address.id] === undefined
    );
    if (stillChecking) return;

    setSelectedId((prev) => {
      const serviceable = addresses.filter((a) => serviceStatus[a.id] === 'serviceable');
      if (serviceable.length === 1) return serviceable[0].id;
      if (serviceable.length > 1) {
        if (prev != null && serviceStatus[prev] === 'serviceable') return prev;
        return null;
      }
      if (prev != null && serviceStatus[prev] !== 'unserviceable') return prev;
      return null;
    });
  }, [addresses, serviceStatus]);

  const handleSaveAddress = async (input: AddressInput) => {
    const res = await createAddress(input);
    const created: Address = res.data.data;
    const nextAddresses = [...addresses, created];
    setAddresses(nextAddresses);
    await evaluateAddresses(nextAddresses);
    setSelectedId(created.id);
    setHighlightAddressId(created.id);
    setShowAdd(false);
    setShowDeliveryConfirm(true);
  };

  const processPayment = async (addressId: number) => {
    const selected = addresses.find((a) => a.id === addressId);
    if (!selected) {
      setError('Please select a delivery address.');
      return;
    }

    const selectedStatus = serviceStatus[selected.id];
    if (selectedStatus === 'unserviceable') {
      setError('The selected address is outside our delivery area. Please choose a serviceable address.');
      return;
    }
    if (selectedStatus === 'unknown') {
      setError('Please add or update this address using current location so we can verify delivery.');
      return;
    }

    setSubmitting(true);
    try {
      const orderRes = await placeOrder({
        items: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity })),
        delivery_address: formatAddressLine(selected),
        delivery_lat: selected.lat != null ? Number(selected.lat) : undefined,
        delivery_lng: selected.lng != null ? Number(selected.lng) : undefined,
      });
      const order = orderRes.data.data;

      const payRes = await initiatePayment({
        amount: parseFloat(order.total_amount),
        reference_type: 'order',
        reference_id: order.id,
      });
      const payment = payRes.data.data;

      if (payment.mock) {
        await verifyPayment({ transaction_id: payment.transaction_id });
      } else {
        Alert.alert(
          'Complete payment',
          'Razorpay checkout on mobile requires a development build. Payment was initiated — complete it on web for now.'
        );
      }

      clearCart();
      setShowDeliveryConfirm(false);
      Alert.alert('Success', `Order ${order.order_number} placed successfully!`, [
        { text: 'View orders', onPress: () => navigation.navigate('Profile', { screen: 'Orders' }) },
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async () => {
    setError('');

    if (needsDeliveryChoice) {
      setShowDeliveryConfirm(true);
      return;
    }

    if (!selectedId) {
      setError('Please select a delivery address.');
      return;
    }

    await processPayment(selectedId);
  };

  const handleConfirmDelivery = async () => {
    if (!selectedId) return;
    await processPayment(selectedId);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Checkout" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + FOOTER_HEIGHT + SPACING.md }]}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Delivery address</Text>
          <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addLink}>
            <Ionicons name="add-circle-outline" size={18} color={COLORS.accent} />
            <Text style={styles.addLinkText}>Add new</Text>
          </TouchableOpacity>
        </View>

        {addresses.length === 0 ? (
          <View style={styles.noAddress}>
            <Text style={styles.noAddressText}>
              No saved addresses yet. Add one with your current location to continue checkout.
            </Text>
            <AppButton label="Add delivery address" variant="accent" onPress={() => setShowAdd(true)} style={styles.addBtn} />
          </View>
        ) : (
          addresses.map((a) => {
            const badge = statusBadge(serviceStatus[a.id]);
            const isSelected = selectedId === a.id;
            const canSelect = serviceStatus[a.id] === 'serviceable';
            return (
              <TouchableOpacity
                key={a.id}
                style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                onPress={() => canSelect && setSelectedId(a.id)}
                disabled={!canSelect && serviceStatus[a.id] === 'unserviceable'}
                activeOpacity={0.85}
              >
                <View style={styles.addressCardTop}>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                  </View>
                  {isSelected ? <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} /> : null}
                </View>
                <Text style={styles.addressName}>{a.name}</Text>
                <Text style={styles.addressLine} numberOfLines={2}>
                  {a.address_line}{a.area ? `, ${a.area}` : ''}, {a.city}, {a.state} - {a.pincode}
                </Text>
                <Text style={styles.addressMobile}>{a.mobile}</Text>
              </TouchableOpacity>
            );
          })
        )}

        {needsDeliveryChoice ? (
          <Text style={styles.hint}>Multiple deliverable addresses found — please select one.</Text>
        ) : null}

        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Order summary</Text>
        {cart.map((item) => (
          <View key={item.product_id} style={styles.summaryItem}>
            <Text style={styles.summaryName}>{item.name} × {item.quantity}</Text>
            <Text style={styles.summaryPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{cartTotal.toFixed(2)}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { bottom: bottomInset }]}>
        <AppButton
          label={
            submitting
              ? 'Processing…'
              : needsDeliveryChoice
                ? 'Choose delivery location'
                : 'Pay with Razorpay'
          }
          variant="accent"
          onPress={handlePay}
          disabled={submitting || !canPay}
          loading={submitting}
        />
      </View>

      <AddAddressModal visible={showAdd} onClose={() => setShowAdd(false)} onSave={handleSaveAddress} />

      <CheckoutDeliveryConfirmModal
        visible={showDeliveryConfirm}
        onClose={() => {
          setShowDeliveryConfirm(false);
          setHighlightAddressId(null);
        }}
        addresses={addresses}
        serviceStatus={serviceStatus}
        highlightAddressId={highlightAddressId}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onConfirm={handleConfirmDelivery}
        confirming={submitting}
        title={highlightAddressId ? 'Confirm delivery address' : 'Choose delivery location'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9f6' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9f6' },
  content: { padding: SPACING.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  sectionTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.accent },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addLinkText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.accent },
  errorBox: {
    backgroundColor: '#fdeaea',
    borderRadius: BORDER_RADIUS,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  errorText: { fontFamily: FONTS.regular, fontSize: 13, color: '#c62828' },
  noAddress: {
    backgroundColor: '#fff8e1',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS,
    marginBottom: SPACING.sm,
  },
  noAddressText: { fontFamily: FONTS.regular, fontSize: 13, color: '#664d03', lineHeight: 19 },
  addBtn: { marginTop: SPACING.sm },
  addressCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  addressCardSelected: { borderColor: COLORS.accent, backgroundColor: '#f8fcf6' },
  addressCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: FONTS.medium, fontSize: 11 },
  addressName: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  addressLine: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight, marginTop: 4, lineHeight: 18 },
  addressMobile: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  hint: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.accent, marginTop: 4 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryName: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text, flex: 1 },
  summaryPrice: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  totalLabel: { fontFamily: FONTS.semiBold, fontSize: 16 },
  totalValue: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.accent },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
