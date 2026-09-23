import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AuthLayout from '../components/AuthLayout';
import AuthPasswordField from '../components/AuthPasswordField';
import AppButton from '../components/AppButton';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { sendOtp, loginWithPassword } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { AuthReturnTarget } from '../hooks/useRequireAuth';

type AuthMode = 'login' | 'signup';

function validateGmail(value: string) {
  return /@gmail\.com$/i.test(value.trim());
}

function navigateAfterAuth(navigation: any, returnTo?: AuthReturnTarget) {
  if (!returnTo) {
    if (navigation.canGoBack()) navigation.goBack();
    return;
  }
  switch (returnTo.type) {
    case 'checkout':
      navigation.navigate('Main', { screen: 'Cart', params: { screen: 'Checkout' } });
      break;
    case 'subscription':
      navigation.navigate('Main', { screen: 'Profile', params: { screen: 'Subscription' } });
      break;
    case 'subscriptionCreate':
      navigation.navigate('Main', { screen: 'Home', params: { screen: 'SubscriptionCreate' } });
      break;
    case 'profile':
      navigation.navigate('Main', { screen: 'Profile' });
      break;
    default:
      navigation.goBack();
  }
}

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { login } = useAuth();
  const returnTo = route.params?.returnTo as AuthReturnTarget | undefined;

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [popup, setPopup] = useState({ show: false, title: '', message: '' });
  const [loading, setLoading] = useState(false);

  const showPopup = (title: string, message: string) => setPopup({ show: true, title, message });

  const handleSignup = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!validateGmail(trimmed)) {
      showPopup('Invalid email', 'Please enter a valid Gmail address (@gmail.com only).');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(trimmed);
      navigation.navigate('VerifyOtp', { email: trimmed, returnTo });
    } catch (err: any) {
      showPopup('Sign up failed', err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!validateGmail(trimmed)) {
      showPopup('Invalid email', 'Please enter a valid Gmail address (@gmail.com only).');
      return;
    }
    if (!password) {
      showPopup('Missing password', 'Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginWithPassword(trimmed, password);
      const { token, user } = res.data.data;
      await login(token, user);
      navigateAfterAuth(navigation, returnTo);
    } catch (err: any) {
      const code = err.response?.data?.code;
      if (code === 'ACCOUNT_NOT_FOUND') {
        showPopup('Sign in failed', 'No account found');
      } else if (code === 'INVALID_CREDENTIALS') {
        showPopup('Sign in failed', 'Invalid email or password');
      } else {
        showPopup('Sign in failed', err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout
        title={mode === 'login' ? 'Welcome back' : 'Create your account'}
        subtitle={
          mode === 'login'
            ? 'Sign in to manage orders, subscriptions & deliveries.'
            : 'Use your Gmail — we’ll verify you with a one-time code.'
        }
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main'))}
      >
        <View style={styles.modeSwitch}>
          <AppButton
            label="Login"
            small
            variant={mode === 'login' ? 'accent' : 'outline'}
            onPress={() => setMode('login')}
            style={styles.modeBtn}
          />
          <AppButton
            label="Sign Up"
            small
            variant={mode === 'signup' ? 'accent' : 'outline'}
            onPress={() => setMode('signup')}
            style={styles.modeBtn}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Gmail address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@gmail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          {mode === 'signup' && (
            <Text style={styles.hint}>Only @gmail.com addresses are supported</Text>
          )}
        </View>

        {mode === 'login' && (
          <AuthPasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
          />
        )}

        <AppButton
          label={
            loading
              ? mode === 'login'
                ? 'Signing in…'
                : 'Sending code…'
              : mode === 'login'
                ? 'Sign in'
                : 'Continue with OTP'
          }
          variant="accent"
          onPress={mode === 'login' ? handleLogin : handleSignup}
          loading={loading}
          disabled={loading}
          style={styles.submit}
        />

        <Text style={styles.legal}>
          By continuing, you agree to our Terms and Privacy Policy.
        </Text>
      </AuthLayout>

      <Modal visible={popup.show} transparent animationType="fade">
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setPopup({ ...popup, show: false })}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{popup.title}</Text>
            <Text style={styles.modalMsg}>{popup.message}</Text>
            <AppButton label="OK" onPress={() => setPopup({ ...popup, show: false })} />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modeSwitch: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  modeBtn: { flex: 1 },
  field: { marginBottom: SPACING.md },
  label: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    fontFamily: FONTS.regular,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: COLORS.text,
  },
  hint: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight, marginTop: 6 },
  submit: { marginTop: SPACING.sm },
  legal: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: 18,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  modalTitle: { fontFamily: FONTS.semiBold, fontSize: 17, color: COLORS.text },
  modalMsg: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textLight, lineHeight: 20 },
});
