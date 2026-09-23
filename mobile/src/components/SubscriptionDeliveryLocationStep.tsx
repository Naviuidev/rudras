import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { checkServiceArea, getAddresses, getServiceLocations } from '../services/api';
import { fetchDeviceLocation } from '../utils/deviceLocation';
import { parseServiceLocationName } from '../utils/addressLocation';
import type { Address, AddressServiceStatus, ServiceLocation } from '../types/address';
import type { DeliveryChoice } from '../types/deliveryLocation';

interface SubscriptionDeliveryLocationStepProps {
  selected: DeliveryChoice | null;
  onSelect: (choice: DeliveryChoice) => void;
}

export default function SubscriptionDeliveryLocationStep({
  selected,
  onSelect,
}: SubscriptionDeliveryLocationStepProps) {
  const [loading, setLoading] = useState(true);
  const [gpsChecking, setGpsChecking] = useState(false);
  const [gpsServiceable, setGpsServiceable] = useState<boolean | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLabel, setGpsLabel] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [serviceStatus, setServiceStatus] = useState<Record<number, AddressServiceStatus>>({});
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [locationHint, setLocationHint] = useState('');

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

  const checkGpsLocation = useCallback(async () => {
    setGpsChecking(true);
    setGpsServiceable(null);
    setGpsLabel('');
    setGpsCoords(null);
    try {
      const { latitude, longitude } = await fetchDeviceLocation();
      const res = await checkServiceArea(latitude, longitude);
      const result = res.data.data;
      const label = result.location?.name || 'Current location';
      setGpsCoords({ lat: latitude, lng: longitude });
      setGpsLabel(label);
      setGpsServiceable(result.in_service_area);
      if (result.in_service_area) {
        onSelect({ kind: 'gps', lat: latitude, lng: longitude, label });
        setLocationHint('Your current location is within our delivery area.');
      } else {
        setLocationHint(
          result.message ||
            'Your current location is outside our delivery area. Please select one of our service areas below.'
        );
      }
    } catch {
      setGpsServiceable(false);
      setLocationHint('Could not verify your location. Please select a delivery area we serve.');
    } finally {
      setGpsChecking(false);
    }
  }, [onSelect]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const [addrRes, locRes] = await Promise.all([getAddresses(), getServiceLocations()]);
        if (cancelled) return;
        const list = addrRes.data.data || [];
        const locations = (locRes.data.data || []).filter(
          (loc: ServiceLocation) => loc.lat != null && loc.lng != null
        );
        setAddresses(list);
        setServiceLocations(locations);
        await evaluateAddresses(list);
        await checkGpsLocation();
      } catch {
        if (!cancelled) {
          setLocationHint('Could not load delivery options. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [checkGpsLocation, evaluateAddresses]);

  const serviceableAddresses = addresses.filter((a) => serviceStatus[a.id] === 'serviceable');

  const isSelected = (choice: DeliveryChoice) => {
    if (!selected) return false;
    if (choice.kind === 'address' && selected.kind === 'address') {
      return choice.address.id === selected.address.id;
    }
    if (choice.kind === 'service_location' && selected.kind === 'service_location') {
      return choice.location.id === selected.location.id;
    }
    if (choice.kind === 'gps' && selected.kind === 'gps') {
      return choice.lat === selected.lat && choice.lng === selected.lng;
    }
    return false;
  };

  const renderOption = (choice: DeliveryChoice, title: string, subtitle?: string) => {
    const active = isSelected(choice);
    return (
      <TouchableOpacity
        key={
          choice.kind === 'address'
            ? `addr-${choice.address.id}`
            : choice.kind === 'service_location'
              ? `loc-${choice.location.id}`
              : 'gps'
        }
        style={[styles.option, active && styles.optionSelected]}
        onPress={() => onSelect(choice)}
        activeOpacity={0.85}
      >
        <View style={[styles.radio, active && styles.radioSelected]}>
          {active ? <View style={styles.radioDot} /> : null}
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
        </View>
        {choice.kind === 'service_location' ? (
          <Ionicons name="location" size={18} color={COLORS.accent} />
        ) : null}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Checking delivery availability…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.stepTitle}>Choose delivery area</Text>
      <Text style={styles.stepSubtitle}>
        Confirm where you want this subscription delivered. Select your saved address or one of our service areas.
      </Text>

      {locationHint ? (
        <View style={[styles.hintBox, gpsServiceable === false && styles.hintBoxWarn]}>
          <Text style={[styles.hintText, gpsServiceable === false && styles.hintTextWarn]}>{locationHint}</Text>
        </View>
      ) : null}

      {gpsChecking ? (
        <Text style={styles.checking}>Checking your current location…</Text>
      ) : gpsServiceable && gpsCoords ? (
        renderOption(
          { kind: 'gps', lat: gpsCoords.lat, lng: gpsCoords.lng, label: gpsLabel },
          'Use current location',
          gpsLabel
        )
      ) : null}

      {serviceableAddresses.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Your saved addresses</Text>
          {serviceableAddresses.map((address) =>
            renderOption(
              { kind: 'address', address },
              address.name,
              `${address.address_line}${address.area ? ', ' + address.area : ''}, ${address.city}`
            )
          )}
        </>
      ) : null}

      {serviceLocations.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Areas we deliver to</Text>
          {serviceLocations.map((location) => {
            const parsed = parseServiceLocationName(location.name);
            const subtitle = [parsed.locality, parsed.city, parsed.state].filter(Boolean).join(', ');
            return renderOption(
              { kind: 'service_location', location },
              location.name,
              subtitle || 'Service area'
            );
          })}
        </>
      ) : (
        <Text style={styles.empty}>No service areas configured yet. Please contact support.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: SPACING.sm },
  loading: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  loadingText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight },
  stepTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.accent },
  stepSubtitle: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight, lineHeight: 20 },
  hintBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: BORDER_RADIUS,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  hintBoxWarn: {
    backgroundColor: '#fff8e1',
    borderColor: '#ffe082',
  },
  hintText: { fontFamily: FONTS.regular, fontSize: 12, color: '#2e7d32', lineHeight: 18 },
  hintTextWarn: { color: '#664d03' },
  checking: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight },
  sectionLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  optionSelected: { borderColor: COLORS.accent, backgroundColor: '#f8fcf6' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: COLORS.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  optionContent: { flex: 1 },
  optionTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  optionSubtitle: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight, marginTop: 2, lineHeight: 17 },
  empty: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight, textAlign: 'center', padding: SPACING.md },
});
