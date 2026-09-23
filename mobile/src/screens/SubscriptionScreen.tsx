import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import {
  getActiveSubscription,
  getSubscriptions,
  pauseDeliveryDates,
  resumeSubscription,
} from '../services/api';

export default function SubscriptionScreen() {
  const navigation = useNavigation<any>();
  const [active, setActive] = useState<any>(null);
  const [history, setHistory] = useState([]);
  const [pauseDate, setPauseDate] = useState('');

  const loadData = async () => {
    try {
      const [activeRes, histRes] = await Promise.all([
        getActiveSubscription(),
        getSubscriptions(),
      ]);
      setActive(activeRes.data.data);
      setHistory(histRes.data.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePauseDate = async () => {
    if (!active || !pauseDate) {
      Alert.alert('Error', 'Enter a date to pause (YYYY-MM-DD)');
      return;
    }
    try {
      await pauseDeliveryDates(active.id, [pauseDate]);
      setPauseDate('');
      await loadData();
      Alert.alert('Paused', 'Delivery paused for selected date. Day added to remaining balance.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to pause');
    }
  };

  const handleResume = async () => {
    if (!active) return;
    try {
      await resumeSubscription(active.id);
      await loadData();
      Alert.alert('Resumed', 'Subscription resumed.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to resume');
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Subscription" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {!active ? (
          <Card title="No active subscription">
            <Text style={styles.desc}>
              Choose a product, pick your delivery schedule, and pay securely — just like on the web.
            </Text>
            <AppButton
              label="Create subscription"
              variant="accent"
              onPress={() => navigation.navigate('SubscriptionCreate')}
            />
          </Card>
        ) : (
          <>
            <Card title="Active Subscription">
              <View style={styles.statGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{active.quantity}</Text>
                  <Text style={styles.statLbl}>Per delivery</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{active.remaining_days}</Text>
                  <Text style={styles.statLbl}>Days Left</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{active.carried_forward_days || 0}</Text>
                  <Text style={styles.statLbl}>Carried Forward</Text>
                </View>
              </View>
              <Text style={styles.dateRange}>
                {active.start_date} → {active.end_date}
              </Text>
              {active.status === 'paused' && (
                <AppButton label="Resume Subscription" variant="accent" onPress={handleResume} style={styles.mt} />
              )}
            </Card>

            <Card title="Pause Delivery">
              <Text style={styles.desc}>Skip a delivery day — it will be added to your remaining balance.</Text>
              <TextInput
                style={styles.input}
                value={pauseDate}
                onChangeText={setPauseDate}
                placeholder="YYYY-MM-DD"
              />
              <AppButton label="Pause this date" onPress={handlePauseDate} />
            </Card>
          </>
        )}

        {history.length > 0 && (
          <Card title="Subscription History">
            {history.map((sub: any) => (
              <View key={sub.id} style={styles.histItem}>
                <View>
                  <Text style={styles.histDays}>{sub.total_days} days — qty {sub.quantity}</Text>
                  <Text style={styles.histDate}>{sub.start_date} to {sub.end_date}</Text>
                </View>
                <Text style={[styles.histStatus, sub.status === 'active' && { color: COLORS.success }]}>
                  {sub.status}
                </Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9f6' },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  desc: { fontFamily: FONTS.regular, color: COLORS.textLight, marginBottom: SPACING.md, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.md,
    backgroundColor: '#fafafa',
  },
  statGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SPACING.md },
  statBox: { alignItems: 'center' },
  statVal: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.accent },
  statLbl: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight },
  dateRange: { fontFamily: FONTS.regular, color: COLORS.textLight, textAlign: 'center' },
  mt: { marginTop: SPACING.md },
  histItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  histDays: { fontFamily: FONTS.medium, fontSize: 14 },
  histDate: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight },
  histStatus: { fontFamily: FONTS.medium, textTransform: 'capitalize', color: COLORS.textLight },
});
