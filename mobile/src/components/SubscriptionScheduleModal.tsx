import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from './AppButton';
import DeliveryDatePicker from './DeliveryDatePicker';
import RemoteImage from './RemoteImage';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
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
import SubscriptionDeliveryLocationStep from './SubscriptionDeliveryLocationStep';
import { createSubscription, initiatePayment, verifyPayment } from '../services/api';
import type { DeliveryChoice } from '../types/deliveryLocation';
import { deliveryChoiceLabel } from '../types/deliveryLocation';

interface SubscriptionScheduleModalProps {
  visible: boolean;
  product: {
    id: number;
    name: string;
    image?: string;
    price?: number | string;
    price_after_offer?: number | string | null;
    quantity?: number | string | null;
    quantity_unit?: string | null;
  } | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SubscriptionScheduleModal({
  visible,
  product,
  onClose,
  onSuccess,
}: SubscriptionScheduleModalProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState(tomorrowIso());
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('daily');
  const [schedule, setSchedule] = useState<ScheduleState>(() => createSchedule('daily', tomorrowIso()));
  const [step, setStep] = useState<2 | 3 | 4>(2);
  const [deliveryChoice, setDeliveryChoice] = useState<DeliveryChoice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [scheduleHint, setScheduleHint] = useState('');

  const resetSchedule = useCallback((freq: SubscriptionFrequency, anchor: string) => {
    setSchedule(createSchedule(freq, anchor));
    setScheduleHint('');
  }, []);

  useEffect(() => {
    if (!visible) return;
    setStep(2);
    setDeliveryChoice(null);
    setQuantity(1);
    setStartDate(tomorrowIso());
    setFrequency('daily');
    setSchedule(createSchedule('daily', tomorrowIso()));
    setError('');
    setScheduleHint('');
    setSubmitting(false);
  }, [visible, product?.id]);

  if (!product) return null;

  const pricePerDay = parseFloat(String(product.price_after_offer || product.price || 0));
  const deliveryDates = schedule.deliveryDates;
  const deliveryCount = deliveryDates.length;
  const totalAmount = pricePerDay * quantity * deliveryCount;
  const sortedDates = sortDates(deliveryDates);
  const frequencyLabel =
    frequency === 'custom'
      ? 'Custom calendar'
      : FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label ?? frequency;

  const qtyLabel =
    product.quantity && product.quantity_unit
      ? `${product.quantity} ${product.quantity_unit}`
      : product.quantity_unit || '';

  const handleFrequencyChange = (freq: SubscriptionFrequency) => {
    setFrequency(freq);
    resetSchedule(freq, startDate);
  };

  const handleToggleDate = (iso: string) => {
    const result = toggleScheduleDate(schedule, iso, frequency, todayIso());
    setSchedule(result.state);
    setScheduleHint(result.message ?? '');
  };

  const handleSubmit = async () => {
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
        product_id: product.id,
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

      onClose();
      onSuccess?.();
      Alert.alert('Success', 'Subscription scheduled successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create subscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Text style={styles.headerTitle}>Schedule delivery</Text>
        <TouchableOpacity onPress={onClose} hitSlop={12} disabled={submitting}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: bottomInset + 88 }]}>
        <View style={styles.productHero}>
          <View style={styles.productImgWrap}>
            <RemoteImage uri={product.image} label={product.name} style={styles.productImg} />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            {qtyLabel ? <Text style={styles.productMeta}>{qtyLabel}</Text> : null}
            <Text style={styles.productPrice}>₹{pricePerDay.toFixed(2)}/delivery</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.stepTitle}>Delivery schedule</Text>
            <Text style={styles.stepSubtitle}>
              Pick a plan, then adjust dates. Skip days you cannot receive.
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
              >
                <Ionicons name="calendar-outline" size={22} color={frequency === 'custom' ? '#fff' : COLORS.accent} />
              </TouchableOpacity>
            </View>

            <DeliveryDatePicker
              schedule={schedule}
              frequency={frequency}
              onToggleDate={handleToggleDate}
              showReset={frequency !== 'custom'}
              onReset={() => resetSchedule(frequency, startDate)}
              hintMessage={scheduleHint}
            />

            <View style={styles.qtyCard}>
              <Text style={styles.label}>Quantity per delivery</Text>
              <View style={styles.qtyControls}>
                <AppButton label="−" small onPress={() => setQuantity(Math.max(1, quantity - 1))} />
                <Text style={styles.qtyVal}>{quantity}</Text>
                <AppButton label="+" small onPress={() => setQuantity(quantity + 1)} />
              </View>
            </View>
          </>
        ) : step === 3 ? (
          <SubscriptionDeliveryLocationStep selected={deliveryChoice} onSelect={setDeliveryChoice} />
        ) : (
          <>
            <Text style={styles.stepTitle}>Review order</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewLine}>{product.name} × {quantity}</Text>
              <Text style={styles.reviewLine}>Frequency: {frequencyLabel}</Text>
              <Text style={styles.reviewLine}>{deliveryCount} deliveries</Text>
              <Text style={styles.reviewLine}>
                {formatDisplayDate(sortedDates[0])} → {formatDisplayDate(sortedDates[sortedDates.length - 1])}
              </Text>
              {deliveryChoice ? (
                <Text style={styles.reviewLine}>Delivery: {deliveryChoiceLabel(deliveryChoice)}</Text>
              ) : null}
              <View style={styles.reviewDivider} />
              <Text style={styles.reviewTotal}>Total: ₹{totalAmount.toFixed(2)}</Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset }]}>
        {step === 2 ? (
          <View style={styles.footerRow}>
            <AppButton label="Cancel" variant="outline" onPress={onClose} style={styles.footerBtn} disabled={submitting} />
            <AppButton
              label="Choose delivery area"
              variant="accent"
              style={styles.footerBtn}
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
        ) : step === 3 ? (
          <View style={styles.footerRow}>
            <AppButton label="Back" variant="outline" onPress={() => setStep(2)} style={styles.footerBtn} disabled={submitting} />
            <AppButton
              label="Review order"
              variant="accent"
              style={styles.footerBtn}
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
        ) : (
          <View style={styles.footerRow}>
            <AppButton label="Back" variant="outline" onPress={() => setStep(3)} style={styles.footerBtn} disabled={submitting} />
            <AppButton
              label={submitting ? 'Processing…' : 'Pay with Razorpay'}
              variant="accent"
              style={styles.footerBtn}
              onPress={handleSubmit}
              disabled={submitting || !deliveryChoice}
              loading={submitting}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  body: { padding: SPACING.md },
  productHero: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  productImgWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  productImg: { width: '100%', height: '100%' },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text },
  productMeta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  productPrice: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.accent, marginTop: 4 },
  stepTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.accent, marginBottom: 4 },
  stepSubtitle: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight, lineHeight: 20, marginBottom: SPACING.sm },
  errorBox: { backgroundColor: '#fdecea', borderRadius: BORDER_RADIUS, padding: SPACING.sm, marginBottom: SPACING.sm },
  errorText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.error },
  fieldCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
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
  freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: SPACING.sm },
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
  calendarBtnActive: { backgroundColor: COLORS.accent },
  qtyCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyVal: { fontFamily: FONTS.bold, fontSize: 18, minWidth: 24, textAlign: 'center' },
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
  footer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  footerRow: { flexDirection: 'row', gap: SPACING.sm },
  footerBtn: { flex: 1 },
});
