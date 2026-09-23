import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from './AppButton';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import type { Address, AddressServiceStatus } from '../types/address';

function formatShortAddress(a: Address): string {
  return `${a.address_line}${a.area ? ', ' + a.area : ''}, ${a.city}, ${a.state} - ${a.pincode}`;
}

interface CheckoutDeliveryConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  addresses: Address[];
  serviceStatus: Record<number, AddressServiceStatus>;
  highlightAddressId?: number | null;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onConfirm: () => void;
  confirming: boolean;
  title?: string;
}

export default function CheckoutDeliveryConfirmModal({
  visible,
  onClose,
  addresses,
  serviceStatus,
  highlightAddressId,
  selectedId,
  onSelect,
  onConfirm,
  confirming,
  title = 'Choose delivery location',
}: CheckoutDeliveryConfirmModalProps) {
  const serviceable = addresses.filter((a) => serviceStatus[a.id] === 'serviceable');
  const checking = addresses.some((a) => serviceStatus[a.id] === 'checking');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.lead}>
          {highlightAddressId
            ? 'Your new address has been saved. Select where you want this order delivered, then continue to payment.'
            : 'Select the delivery address for this order.'}
        </Text>

        {checking ? (
          <Text style={styles.checking}>Checking delivery availability for your addresses…</Text>
        ) : null}

        {serviceable.length === 0 && !checking ? (
          <Text style={styles.error}>
            No serviceable addresses found. Please add an address within our delivery area.
          </Text>
        ) : (
          serviceable.map((a) => {
            const isHighlighted = highlightAddressId === a.id;
            const isSelected = selectedId === a.id;
            return (
              <TouchableOpacity
                key={a.id}
                style={[styles.option, isSelected && styles.optionSelected, isHighlighted && styles.optionNew]}
                onPress={() => onSelect(a.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.optionContent}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{a.name}</Text>
                    {isHighlighted ? (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>New</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.meta}>{a.mobile}</Text>
                  <Text style={styles.address}>{formatShortAddress(a)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <AppButton label="Cancel" variant="outline" onPress={onClose} disabled={confirming} style={styles.footerBtn} />
        <AppButton
          label={confirming ? 'Processing…' : 'Confirm & Pay'}
          variant="accent"
          onPress={onConfirm}
          disabled={confirming || !selectedId || serviceStatus[selectedId!] !== 'serviceable'}
          loading={confirming}
          style={styles.footerBtn}
        />
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
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  body: { padding: SPACING.md, paddingBottom: SPACING.xl },
  lead: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textLight, lineHeight: 21, marginBottom: SPACING.md },
  checking: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight, marginBottom: SPACING.sm },
  error: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.error },
  option: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  optionSelected: { borderColor: COLORS.accent, backgroundColor: '#f8fcf6' },
  optionNew: { borderColor: '#9ec5eb' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioSelected: { borderColor: COLORS.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  optionContent: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  newBadge: { backgroundColor: '#e8f2fc', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  newBadgeText: { fontFamily: FONTS.medium, fontSize: 10, color: '#2a5f9e' },
  meta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  address: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text, marginTop: 4, lineHeight: 18 },
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
