import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from './AppButton';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface ServiceAreaPromptProps {
  visible: boolean;
  loading: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

export default function ServiceAreaPrompt({ visible, loading, onAllow, onDismiss }: ServiceAreaPromptProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="location-outline" size={32} color={COLORS.accent} />
          </View>
          <Text style={styles.title}>Allow location access</Text>
          <Text style={styles.body}>
            We use your location to confirm we deliver fresh milk and dairy to your area before you order or subscribe.
          </Text>
          <AppButton
            label={loading ? 'Checking…' : 'Allow location'}
            variant="accent"
            onPress={onAllow}
            disabled={loading}
            loading={loading}
            style={styles.allowBtn}
          />
          <AppButton label="Not now" variant="ghost" onPress={onDismiss} disabled={loading} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text, marginBottom: SPACING.sm, textAlign: 'center' },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: SPACING.lg,
  },
  allowBtn: { alignSelf: 'stretch', marginBottom: SPACING.sm },
});
