import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import DeliveryDatePicker from '../components/DeliveryDatePicker';
import AppButton from '../components/AppButton';
import RemoteImage from '../components/RemoteImage';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SCREEN_BG } from '../constants/theme';
import { FREQUENCY_OPTIONS, CALENDAR_FREQUENCY } from '../utils/subscriptionOptions';
import {
  formatDisplayDate,
  sortDates,
  tomorrowIso,
  todayIso,
  type SubscriptionFrequency,
} from '../utils/subscriptionDates';
import {
  createSchedule,
  toggleScheduleDate,
  type ScheduleState,
} from '../utils/subscriptionSchedule';
import { createSubscription, getProducts, initiatePayment, verifyPayment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useServiceArea } from '../context/ServiceAreaContext';
import SubscriptionDeliveryLocationStep from '../components/SubscriptionDeliveryLocationStep';
import type { DeliveryChoice } from '../types/deliveryLocation';
import { deliveryChoiceLabel } from '../types/deliveryLocation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SubscriptionCreateScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isAuthenticated } = useAuth();
  const requireAuth = useRequireAuth();
  const { promptForServiceArea, status } = useServiceArea();
  const initialProductId = route.params?.productId as number | undefined;

  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState(tomorrowIso());
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('daily');
  const [schedule, setSchedule] = useState<ScheduleState>(() => createSchedule('daily', tomorrowIso()));
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialProductId ? 2 : 1);
  const [deliveryChoice, setDeliveryChoice] = useState<DeliveryChoice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [scheduleHint, setScheduleHint] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth({ type: 'subscriptionCreate' });
      navigation.goBack();
    }
  }, [isAuthenticated, navigation, requireAuth]);

  useEffect(() => {
    if (status === 'unknown') {
      promptForServiceArea();
    }
  }, [status, promptForServiceArea]);

  useEffect(() => {
    getProducts()
      .then((res) => {
        const subs = (res.data.data || []).filter((p: any) => p.monthly_subscription === 1);
        setProducts(subs);
        if (subs.length === 0) return;
        const match = initialProductId && subs.some((p: any) => p.id === initialProductId);
        setProductId(String(match ? initialProductId : subs[0].id));
        if (match) setStep(2);
      })
      .catch(() => setProducts([]));
  }, [initialProductId]);

  const resetSchedule = useCallback((freq: SubscriptionFrequency, anchor: string) => {
    setSchedule(createSchedule(freq, anchor));
    setScheduleHint('');
  }, []);

  const selectedProduct = products.find((p) => p.id === Number(productId));
  const pricePerDay = selectedProduct
    ? parseFloat(selectedProduct.price_after_offer || selectedProduct.price)
    : 0;
  const deliveryDates = schedule.deliveryDates;
  const deliveryCount = deliveryDates.length;
  const totalAmount = pricePerDay * quantity * deliveryCount;
  const sortedDates = sortDates(deliveryDates);

  const handleFrequencyChange = (freq: SubscriptionFrequency) => {
    setFrequency(freq);
    resetSchedule(freq, startDate);
  };

  const handleToggleDate = (iso: string) => {
    const result = toggleScheduleDate(schedule, iso, frequency, todayIso());
    setSchedule(result.state);
    setScheduleHint(result.message ?? '');
  };

  const frequencyLabel =
    frequency === 'custom'
      ? 'Custom calendar'
      : FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label ?? frequency;

  const safeInsets = useSafeAreaInsets();
  const bottomInset = Math.max(safeInsets.bottom, 12);
  const FOOTER_HEIGHT = 72;

  const handleSubmit = async () => {
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }
    if (deliveryCount < 1) {
      setError('Please select at least one delivery date');
      return;
    }
    if (!deliveryChoice) {
      setError('Please select a delivery area to continue.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const subscriptionRes = await createSubscription({
        quantity,
        total_days: deliveryCount,
        price_per_day: pricePerDay,
        start_date: sortedDates[0],
        end_date: sortedDates[sortedDates.length - 1],
        frequency,
        product_id: selectedProduct.id,
        delivery_dates: sortedDates,
        total_amount: totalAmount,
      });
      const subscription = subscriptionRes.data.data;

      const payRes = await initiatePayment({
        amount: parseFloat(subscription.total_amount) || totalAmount,
        reference_type: 'subscription',
        reference_id: subscription.id,
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

      Alert.alert('Success', 'Subscription created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Subscription') },
      ]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create subscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Schedule delivery" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + FOOTER_HEIGHT + SPACING.md }]}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>Choose product</Text>
            <Text style={styles.stepSubtitle}>Select a subscription item and quantity per delivery.</Text>

            {products.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.productRow, productId === String(p.id) && styles.productActive]}
                onPress={() => setProductId(String(p.id))}
                activeOpacity={0.85}
              >
                <View style={styles.productImgWrap}>
                  <RemoteImage uri={p.image} label={p.name} style={styles.productImg} />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productPrice}>
                    ₹{parseFloat(p.price_after_offer || p.price).toFixed(2)}/delivery
                  </Text>
                </View>
                {productId === String(p.id) ? (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.accent} />
                ) : null}
              </TouchableOpacity>
            ))}

            <View style={styles.qtyCard}>
              <Text style={styles.label}>Quantity per delivery</Text>
              <View style={styles.qtyControls}>
                <AppButton label="−" small onPress={() => setQuantity(Math.max(1, quantity - 1))} />
                <Text style={styles.qtyVal}>{quantity}</Text>
                <AppButton label="+" small onPress={() => setQuantity(quantity + 1)} />
              </View>
            </View>

          </View>
        )}

        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>Delivery schedule</Text>
            <Text style={styles.stepSubtitle}>
              Pick a plan, then adjust dates. Skip days you cannot receive — add them later as add-ons.
            </Text>

            <View style={styles.fieldCard}>
              <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={(v) => {
                  setStartDate(v);
                  if (frequency !== 'custom') resetSchedule(frequency, v);
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.freqRow}>
              {FREQUENCY_OPTIONS.map((opt) => (
                <AppButton
                  key={opt.value}
                  label={opt.label}
                  small
                  onPress={() => handleFrequencyChange(opt.value)}
                  variant={frequency === opt.value ? 'accent' : 'outline'}
                  style={styles.freqBtn}
                />
              ))}
              <TouchableOpacity
                style={[styles.calendarBtn, frequency === 'custom' && styles.calendarBtnActive]}
                onPress={() => handleFrequencyChange(CALENDAR_FREQUENCY)}
                activeOpacity={0.85}
                accessibilityLabel="Custom calendar"
              >
                <Ionicons
                  name="calendar-outline"
                  size={22}
                  color={frequency === 'custom' ? '#fff' : COLORS.accent}
                />
              </TouchableOpacity>
            </View>

            {frequency !== 'custom' ? (
              <Text style={styles.freqHint}>
                Tap a green date to skip it. Use add-on slots to move missed deliveries to future days.
              </Text>
            ) : (
              <Text style={styles.freqHint}>Use the calendar to pick any delivery days freely.</Text>
            )}

            <DeliveryDatePicker
              schedule={schedule}
              frequency={frequency}
              onToggleDate={handleToggleDate}
              showReset={frequency !== 'custom'}
              onReset={() => resetSchedule(frequency, startDate)}
              hintMessage={scheduleHint}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.section}>
            <SubscriptionDeliveryLocationStep
              selected={deliveryChoice}
              onSelect={setDeliveryChoice}
            />
          </View>
        )}

        {step === 4 && selectedProduct && (
          <View style={styles.section}>
            <Text style={styles.stepTitle}>Review order</Text>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLine}>{selectedProduct.name} × {quantity}</Text>
              <Text style={styles.reviewLine}>Frequency: {frequencyLabel}</Text>
              <Text style={styles.reviewLine}>{deliveryCount} deliveries</Text>
              {schedule.missedDates.length > 0 ? (
                <Text style={styles.reviewLine}>
                  {schedule.missedDates.length} skipped · {schedule.addonDates.length} add-on
                </Text>
              ) : null}
              <Text style={styles.reviewLine}>
                {formatDisplayDate(sortedDates[0])} → {formatDisplayDate(sortedDates[sortedDates.length - 1])}
              </Text>
              {deliveryChoice ? (
                <Text style={styles.reviewLine}>Delivery: {deliveryChoiceLabel(deliveryChoice)}</Text>
              ) : null}
              <View style={styles.reviewDivider} />
              <Text style={styles.reviewTotal}>Total: ₹{totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { bottom: bottomInset }]}>
        {step === 1 ? (
          <AppButton label="Next: Schedule" onPress={() => setStep(2)} variant="accent" />
        ) : null}
        {step === 2 ? (
          <View style={styles.stepActions}>
            <AppButton label="Back" onPress={() => setStep(1)} style={styles.actionBtn} />
            <AppButton
              label="Choose delivery area"
              variant="accent"
              style={styles.actionBtn}
              onPress={() => {
                if (deliveryCount < 1) {
                  setError('Select at least one delivery date');
                  return;
                }
                setError('');
                setStep(3);
              }}
            />
          </View>
        ) : null}
        {step === 3 ? (
          <View style={styles.stepActions}>
            <AppButton label="Back" onPress={() => setStep(2)} style={styles.actionBtn} />
            <AppButton
              label="Review order"
              variant="accent"
              style={styles.actionBtn}
              onPress={() => {
                if (!deliveryChoice) {
                  setError('Please select a delivery area to continue.');
                  return;
                }
                setError('');
                setStep(4);
              }}
              disabled={!deliveryChoice}
            />
          </View>
        ) : null}
        {step === 4 ? (
          <View style={styles.stepActions}>
            <AppButton label="Back" onPress={() => setStep(3)} style={styles.actionBtn} disabled={submitting} />
            <AppButton
              label={submitting ? 'Processing…' : 'Pay with Razorpay'}
              variant="accent"
              style={styles.actionBtn}
              onPress={handleSubmit}
              disabled={submitting || !deliveryChoice}
              loading={submitting}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SCREEN_BG },
  scroll: { flex: 1 },
  content: { padding: SPACING.md },
  section: { gap: SPACING.sm },
  stepTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.accent },
  stepSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  errorBox: {
    backgroundColor: '#fdecea',
    borderRadius: BORDER_RADIUS,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#f5c2c0',
  },
  error: { color: COLORS.error, fontFamily: FONTS.medium, fontSize: 13 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  productActive: { borderColor: COLORS.accent, backgroundColor: COLORS.primary },
  productImgWrap: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImg: { width: '100%', height: '100%' },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  productPrice: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.accent, marginTop: 2 },
  qtyCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    fontFamily: FONTS.regular,
    marginTop: 6,
    backgroundColor: '#fafafa',
    color: COLORS.text,
  },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyVal: { fontFamily: FONTS.bold, fontSize: 18, minWidth: 24, textAlign: 'center' },
  fieldCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  freqBtn: { minWidth: 88 },
  calendarBtn: {
    width: 44,
    height: 36,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  calendarBtnActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  freqHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: SCREEN_BG,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  stepActions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { flex: 1 },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewLine: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text },
  reviewDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xs },
  reviewTotal: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.accent },
});
