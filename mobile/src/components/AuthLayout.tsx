import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from './AppButton';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface AuthStep {
  label: string;
  active: boolean;
  done?: boolean;
}

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  steps?: AuthStep[];
  onBack?: () => void;
}

export default function AuthLayout({ title, subtitle, children, steps, onBack }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + SPACING.md }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandPanel}>
          <Text style={styles.brandEmoji}>🌿</Text>
          <Text style={styles.brandTitle}>Rudra&apos;s Farm Fresh</Text>
          <Text style={styles.brandTagline}>Farm-fresh milk & dairy delivered to your doorstep.</Text>
        </View>

        <View style={styles.formPanel}>
          {onBack ? (
            <AppButton label="← Back" small onPress={onBack} style={styles.backBtn} />
          ) : null}

          {steps && steps.length > 0 && (
            <View style={styles.steps}>
              {steps.map((step, i) => (
                <View key={step.label} style={styles.stepWrap}>
                  <View
                    style={[
                      styles.stepCircle,
                      step.done && styles.stepDone,
                      step.active && styles.stepActive,
                    ]}
                  >
                    <Text style={styles.stepNum}>{step.done ? '✓' : i + 1}</Text>
                  </View>
                  <Text style={[styles.stepLabel, step.active && styles.stepLabelActive]}>
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8f9f6' },
  scroll: { paddingBottom: SPACING.xl },
  brandPanel: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  brandEmoji: { fontSize: 48, marginBottom: SPACING.sm },
  brandTitle: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.accent, textAlign: 'center' },
  brandTagline: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  formPanel: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: SPACING.sm },
  steps: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.lg, marginBottom: SPACING.md },
  stepWrap: { alignItems: 'center' },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepActive: { borderColor: COLORS.accent, backgroundColor: COLORS.primary },
  stepDone: { borderColor: COLORS.accent, backgroundColor: COLORS.accent },
  stepNum: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.accent },
  stepLabel: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textLight },
  stepLabelActive: { fontFamily: FONTS.semiBold, color: COLORS.accent },
  title: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text, marginBottom: 6 },
  subtitle: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textLight, marginBottom: SPACING.lg, lineHeight: 20 },
});
