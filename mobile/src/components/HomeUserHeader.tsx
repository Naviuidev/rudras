import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface HomeUserHeaderProps {
  name?: string;
  email?: string;
}

export function firstNameFromUser(name?: string, email?: string): string {
  if (name?.trim()) {
    return name.trim().split(/\s+/)[0];
  }
  if (email?.trim()) {
    const local = email.split('@')[0] || '';
    const part = local.split(/[._-]/)[0] || local;
    return part.charAt(0).toUpperCase() + part.slice(1);
  }
  return 'Guest';
}

export default function HomeUserHeader({ name, email }: HomeUserHeaderProps) {
  const insets = useSafeAreaInsets();
  const displayName = firstNameFromUser(name, email);
  const initial = (displayName[0] || 'G').toUpperCase();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + SPACING.sm }]}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.textCol}>
          <Text style={styles.greeting}>Hello, {displayName}!</Text>
          <Text style={styles.subtitle}>Rudra&apos;s Farm Fresh 🌿</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  avatarText: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.accent },
  textCol: { flex: 1 },
  greeting: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.accent },
  subtitle: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight, marginTop: 2 },
});
