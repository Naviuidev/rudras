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
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  checkServiceArea,
  getErrorMessage,
} from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Address, AddressInput, AddressServiceStatus } from '../types/address';
import { formatAddressLine } from '../utils/addressLocation';

function statusLabel(status?: AddressServiceStatus): { text: string; color: string; bg: string } {
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

export default function AddressesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [serviceStatus, setServiceStatus] = useState<Record<number, AddressServiceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAddresses();
      const list = res.data.data || [];
      setAddresses(list);
      await evaluateAddresses(list);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [evaluateAddresses]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (input: AddressInput) => {
    if (editing) {
      await updateAddress(editing.id, input);
    } else {
      await createAddress(input);
    }
    setEditing(null);
    await load();
  };

  const handleDelete = (addr: Address) => {
    Alert.alert('Delete address', 'Remove this delivery address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAddress(addr.id);
            await load();
          } catch (err) {
            Alert.alert('Error', getErrorMessage(err));
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (addr: Address) => {
    try {
      await updateAddress(addr.id, {
        name: addr.name,
        mobile: addr.mobile,
        address_line: addr.address_line,
        area: addr.area || '',
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        lat: addr.lat,
        lng: addr.lng,
        is_default: true,
      });
      await load();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const openEdit = (addr: Address) => {
    setEditing(addr);
    setShowAdd(true);
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
      <ScreenHeader title="My Addresses" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 80 }]}>
        {addresses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No addresses saved</Text>
            <Text style={styles.emptyText}>Add a delivery address with your current location for faster checkout.</Text>
          </View>
        ) : (
          addresses.map((addr) => {
            const badge = statusLabel(serviceStatus[addr.id]);
            const isDefault = !!addr.is_default;
            return (
              <View key={addr.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardBadges}>
                    {isDefault ? (
                      <View style={[styles.badge, { backgroundColor: '#e8f5e9' }]}>
                        <Text style={[styles.badgeText, { color: '#2e7d32' }]}>Default</Text>
                      </View>
                    ) : null}
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.cardName}>{addr.name}</Text>
                <Text style={styles.cardLine}>{formatAddressLine(addr)}</Text>
                <View style={styles.cardActions}>
                  {!isDefault ? (
                    <TouchableOpacity onPress={() => handleSetDefault(addr)}>
                      <Text style={styles.actionText}>Set default</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={() => openEdit(addr)}>
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(addr)}>
                    <Text style={[styles.actionText, styles.actionDanger]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.footer, { bottom: bottomInset }]}>
        <AppButton label="+ Add Address" variant="accent" onPress={() => { setEditing(null); setShowAdd(true); }} />
      </View>

      <AddAddressModal
        visible={showAdd}
        onClose={() => { setShowAdd(false); setEditing(null); }}
        onSave={handleSave}
        title={editing ? 'Edit Address' : 'Add Address'}
        initial={
          editing
            ? {
                name: editing.name,
                mobile: editing.mobile,
                address_line: editing.address_line,
                area: editing.area || '',
                city: editing.city,
                state: editing.state,
                pincode: editing.pincode,
                lat: editing.lat,
                lng: editing.lng,
                is_default: !!editing.is_default,
              }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9f6' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9f6' },
  content: { padding: SPACING.md },
  empty: { alignItems: 'center', padding: SPACING.xl, gap: SPACING.sm },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  emptyText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 21 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: { marginBottom: SPACING.sm },
  cardBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: FONTS.medium, fontSize: 11 },
  cardName: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text, marginBottom: 4 },
  cardLine: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight, lineHeight: 19 },
  cardActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  actionText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.accent },
  actionDanger: { color: '#c62828' },
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
