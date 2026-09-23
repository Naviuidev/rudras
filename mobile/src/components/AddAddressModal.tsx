import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { fetchDeviceLocation, isLikelySimulator, simulatorLocationHint } from '../utils/deviceLocation';
import AppButton from './AppButton';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { getServiceLocations } from '../services/api';
import type { AddressInput, ServiceLocation } from '../types/address';
import {
  buildMapsLink,
  buildStaticMapUrl,
  matchConfiguredState,
  parseServiceLocationName,
  reverseGeocode,
} from '../utils/addressLocation';

const emptyAddress: AddressInput = {
  name: '',
  mobile: '',
  address_line: '',
  area: '',
  city: '',
  state: '',
  pincode: '',
  is_default: true,
  lat: null,
  lng: null,
};

interface AddAddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (address: AddressInput) => Promise<void>;
  initial?: Partial<AddressInput>;
  title?: string;
}

export default function AddAddressModal({
  visible,
  onClose,
  onSave,
  initial,
  title = 'Add Address',
}: AddAddressModalProps) {
  const [form, setForm] = useState<AddressInput>(emptyAddress);
  const [selectedLocationId, setSelectedLocationId] = useState<number | ''>('');
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [locating, setLocating] = useState(false);
  const [locationHint, setLocationHint] = useState('');
  const [saving, setSaving] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const didAutoLocate = useRef(false);

  const parsedLocations = useMemo(
    () =>
      serviceLocations.map((location) => ({
        ...location,
        parsed: parseServiceLocationName(location.name),
      })),
    [serviceLocations]
  );

  const configuredStates = useMemo(() => {
    const states = parsedLocations.map(({ parsed }) => parsed.state).filter(Boolean);
    return [...new Set(states)];
  }, [parsedLocations]);

  const cityOptions = useMemo(() => {
    if (!form.state) return [];
    return parsedLocations.filter(
      ({ parsed }) => parsed.state.toLowerCase() === form.state.trim().toLowerCase()
    );
  }, [parsedLocations, form.state]);

  const captureLocation = useCallback(async () => {
    setLocating(true);
    setLocationHint('Fetching your current location…');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationHint('Location permission denied. Allow access in Settings and try again.');
        setLocating(false);
        return;
      }

      const { latitude: lat, longitude: lng } = await fetchDeviceLocation();

      try {
        const geocoded = await reverseGeocode(lat, lng);
        const matchedState = matchConfiguredState(geocoded.state || '', configuredStates);
        const geocodedCity = (geocoded.city || '').trim().toLowerCase();
        const matchedLocation = parsedLocations.find(({ parsed }) => {
          if (matchedState && parsed.state.toLowerCase() !== matchedState.toLowerCase()) return false;
          return (
            parsed.city.toLowerCase() === geocodedCity ||
            parsed.locality.toLowerCase() === geocodedCity ||
            parsed.city.toLowerCase().includes(geocodedCity) ||
            geocodedCity.includes(parsed.city.toLowerCase())
          );
        });

        setForm((prev) => ({
          ...prev,
          lat,
          lng,
          address_line: geocoded.address_line || prev.address_line,
          area: geocoded.area || prev.area,
          city: matchedLocation?.parsed.city || geocoded.city || prev.city,
          state: matchedLocation?.parsed.state || matchedState || prev.state,
          pincode: geocoded.pincode || prev.pincode,
        }));
        setSelectedLocationId(matchedLocation?.id ?? '');
        setLocationHint('Location captured. Review the details below and save.');
      } catch {
        setForm((prev) => ({ ...prev, lat, lng }));
        setLocationHint('Location captured. Please complete the address details below.');
      }
    } catch {
      const hint = isLikelySimulator() ? ` ${simulatorLocationHint()}` : '';
      setLocationHint(`Could not access your location. Please try again.${hint}`);
    } finally {
      setLocating(false);
    }
  }, [configuredStates, parsedLocations]);

  useEffect(() => {
    if (!visible) {
      didAutoLocate.current = false;
      return;
    }

    setForm({ ...emptyAddress, ...initial });
    setSelectedLocationId('');
    setLocationHint('');
    setLocating(false);
    setShowStatePicker(false);
    setShowCityPicker(false);

    getServiceLocations()
      .then((res) => setServiceLocations(res.data.data || []))
      .catch(() => setServiceLocations([]));
  }, [visible, initial]);

  useEffect(() => {
    if (!visible || didAutoLocate.current) return;
    if (initial?.lat != null && initial?.lng != null) return;
    didAutoLocate.current = true;
    void captureLocation();
  }, [visible, initial?.lat, initial?.lng, captureLocation]);

  const handleStateChange = (state: string) => {
    setSelectedLocationId('');
    setForm((prev) => ({ ...prev, state, city: '' }));
    setShowStatePicker(false);
  };

  const handleCityChange = (locationId: number) => {
    const location = parsedLocations.find(({ id }) => id === locationId);
    if (!location) return;
    setSelectedLocationId(locationId);
    setForm((prev) => ({
      ...prev,
      state: location.parsed.state,
      city: location.parsed.city,
      area: prev.area || location.parsed.locality,
    }));
    setShowCityPicker(false);
  };

  const handleSave = async () => {
    if (form.lat == null || form.lng == null) {
      setLocationHint('Please allow location access so we can confirm delivery availability.');
      return;
    }

    if (
      !form.name.trim() ||
      !form.mobile.trim() ||
      !form.address_line.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim()
    ) {
      setLocationHint('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setLocationHint(err.response?.data?.message || err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const mapUrl = form.lat != null && form.lng != null ? buildStaticMapUrl(form.lat, form.lng) : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.mapWrap}>
            {mapUrl ? (
              <>
                <Image source={{ uri: mapUrl }} style={styles.mapImage} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.mapLink}
                  onPress={() => Linking.openURL(buildMapsLink(form.lat!, form.lng!))}
                >
                  <Ionicons name="open-outline" size={14} color={COLORS.accent} />
                  <Text style={styles.mapLinkText}>Open in Maps</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.mapPlaceholder}>
                {locating ? (
                  <>
                    <ActivityIndicator color={COLORS.accent} />
                    <Text style={styles.mapPlaceholderText}>Locating you on the map…</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="location-outline" size={28} color={COLORS.textLight} />
                    <Text style={styles.mapPlaceholderText}>
                      Allow location access to preview your delivery point.
                    </Text>
                  </>
                )}
              </View>
            )}
            <AppButton
              label={locating ? 'Updating…' : mapUrl ? 'Update location' : 'Use current location'}
              small
              variant="outline"
              onPress={captureLocation}
              disabled={locating}
              style={styles.mapBtn}
            />
          </View>

          {locationHint ? <Text style={styles.hint}>{locationHint}</Text> : null}

          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(name) => setForm({ ...form, name })}
            placeholder="Full name"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>Mobile *</Text>
          <TextInput
            style={styles.input}
            value={form.mobile}
            onChangeText={(mobile) => setForm({ ...form, mobile })}
            placeholder="10-digit mobile"
            keyboardType="phone-pad"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>Address line *</Text>
          <TextInput
            style={styles.input}
            value={form.address_line}
            onChangeText={(address_line) => setForm({ ...form, address_line })}
            placeholder="House / street / landmark"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>State *</Text>
          <TouchableOpacity style={styles.select} onPress={() => setShowStatePicker((v) => !v)}>
            <Text style={form.state ? styles.selectText : styles.selectPlaceholder}>
              {form.state || 'Select state'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          {showStatePicker && (
            <View style={styles.optionList}>
              {configuredStates.map((state) => (
                <TouchableOpacity key={state} style={styles.option} onPress={() => handleStateChange(state)}>
                  <Text style={styles.optionText}>{state}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>City *</Text>
          <TouchableOpacity
            style={[styles.select, !form.state && styles.selectDisabled]}
            onPress={() => form.state && setShowCityPicker((v) => !v)}
            disabled={!form.state}
          >
            <Text style={form.city ? styles.selectText : styles.selectPlaceholder}>
              {form.city || (form.state ? 'Select city' : 'Select state first')}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
          {showCityPicker && (
            <View style={styles.optionList}>
              {cityOptions.map(({ id, parsed }) => (
                <TouchableOpacity key={id} style={styles.option} onPress={() => handleCityChange(id)}>
                  <Text style={styles.optionText}>{parsed.city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Area</Text>
          <TextInput
            style={styles.input}
            value={form.area}
            onChangeText={(area) => setForm({ ...form, area })}
            placeholder="Locality / area"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>Pincode *</Text>
          <TextInput
            style={styles.input}
            value={form.pincode}
            onChangeText={(pincode) => setForm({ ...form, pincode })}
            placeholder="PIN code"
            keyboardType="number-pad"
            placeholderTextColor={COLORS.textLight}
          />
        </ScrollView>

        <View style={styles.footer}>
          <AppButton label="Cancel" variant="outline" onPress={onClose} disabled={saving} style={styles.footerBtn} />
          <AppButton
            label={saving ? 'Saving…' : 'Save Address'}
            variant="accent"
            onPress={handleSave}
            disabled={saving || locating}
            loading={saving}
            style={styles.footerBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8f9f6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  body: { padding: SPACING.md, paddingBottom: SPACING.xl },
  mapWrap: { marginBottom: SPACING.md },
  mapImage: { width: '100%', height: 160, borderRadius: BORDER_RADIUS, backgroundColor: COLORS.primary },
  mapPlaceholder: {
    height: 160,
    borderRadius: BORDER_RADIUS,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: SPACING.md,
  },
  mapPlaceholderText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  mapLink: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  mapLinkText: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.accent },
  mapBtn: { marginTop: SPACING.sm, alignSelf: 'flex-start' },
  hint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  label: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text, marginBottom: 6, marginTop: SPACING.sm },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text,
  },
  select: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectDisabled: { opacity: 0.55 },
  selectText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text },
  selectPlaceholder: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textLight },
  optionList: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginTop: 4,
    overflow: 'hidden',
  },
  option: { paddingHorizontal: SPACING.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  optionText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text },
  footer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  footerBtn: { flex: 1 },
});
