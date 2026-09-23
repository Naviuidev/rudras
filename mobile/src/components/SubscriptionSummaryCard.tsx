import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import AppButton from './AppButton';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface SubscriptionSummaryProps {
  subscription: {
    quantity: number;
    remaining_days: number;
    total_days: number;
    next_delivery?: string;
    status: string;
  } | null;
  onSubscribe?: () => void;
  onManage?: () => void;
}

export default function SubscriptionSummaryCard({
  subscription,
  onSubscribe,
  onManage,
}: SubscriptionSummaryProps) {
  if (!subscription) {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="water" size={24} color={COLORS.accent} />
          <Text style={styles.heading}>Milk Subscription</Text>
        </View>
        <Text style={styles.emptyText}>No active subscription. Start your daily fresh milk delivery!</Text>
        <AppButton label="Subscribe Now" variant="accent" onPress={onSubscribe} />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="water" size={24} color={COLORS.accent} />
        <Text style={styles.heading}>Active Subscription</Text>
        <View style={[styles.badge, subscription.status === 'paused' && styles.badgePaused]}>
          <Text style={styles.badgeText}>{subscription.status}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{subscription.quantity}</Text>
          <Text style={styles.statLabel}>Per delivery</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{subscription.remaining_days}</Text>
          <Text style={styles.statLabel}>Days Left</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {subscription.next_delivery
              ? new Date(subscription.next_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              : '—'}
          </Text>
          <Text style={styles.statLabel}>Next Delivery</Text>
        </View>
      </View>

      <AppButton label="Manage Subscription" onPress={onManage} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.primary, marginHorizontal: SPACING.md, marginBottom: SPACING.lg },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: 8 },
  heading: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.accent, flex: 1 },
  badge: { backgroundColor: COLORS.success, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgePaused: { backgroundColor: '#f57c00' },
  badgeText: { color: '#fff', fontSize: 11, fontFamily: FONTS.medium, textTransform: 'capitalize' },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.textLight, marginBottom: SPACING.md },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.md },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.accent },
  statLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  divider: { width: 1, backgroundColor: COLORS.border, height: 40 },
});
