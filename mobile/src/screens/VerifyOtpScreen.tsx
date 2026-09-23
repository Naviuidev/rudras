import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AuthLayout from '../components/AuthLayout';
import AuthPasswordField from '../components/AuthPasswordField';
import AppButton from '../components/AppButton';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { verifyOtp, sendOtp, setPassword } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { AuthReturnTarget } from '../hooks/useRequireAuth';

type Step = 'otp' | 'password';

function navigateAfterAuth(navigation: any, returnTo?: AuthReturnTarget) {
  if (!returnTo) {
    navigation.navigate('Main');
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
      navigation.navigate('Main');
  }
}

export default function VerifyOtpScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { login } = useAuth();
  const email = (route.params?.email || '').toLowerCase().trim();
  const returnTo = route.params?.returnTo as AuthReturnTarget | undefined;

  const [step, setStep] = useState<Step>('otp');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) navigation.replace('Login');
  }, [email, navigation]);

  if (!email) return null;

  const handleOtpSubmit = async () => {
    setError('');
    setSuccess('');
    const code = otp.replace(/\D/g, '');
    if (code.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp(email, code);
      const { token, user, needs_password } = res.data.data;
      await login(token, user);
      if (needs_password) {
        setStep('password');
      } else {
        navigateAfterAuth(navigation, returnTo);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await setPassword(password);
      navigateAfterAuth(navigation, returnTo);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setSuccess('');
    try {
      await sendOtp(email);
      setSuccess('A new code has been sent to your email.');
      setOtp('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  const steps = [
    { label: 'Verify', active: step === 'otp', done: step === 'password' },
    { label: 'Password', active: step === 'password', done: false },
  ];

  return (
    <AuthLayout
      title={step === 'otp' ? 'Check your email' : 'Secure your account'}
      subtitle={
        step === 'otp'
          ? `We sent a 6-digit code to ${email}`
          : 'Choose a password for future sign-ins.'
      }
      steps={steps}
      onBack={() => navigation.navigate('Login', { returnTo })}
    >
      {success ? <Text style={styles.success}>{success}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === 'otp' ? (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>One-time code</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="· · · · · ·"
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
          <AppButton
            label={loading ? 'Verifying…' : 'Verify code'}
            variant="accent"
            onPress={handleOtpSubmit}
            loading={loading}
            disabled={loading}
          />
          <View style={styles.secondary}>
            <AppButton label={resending ? 'Sending…' : 'Resend code'} variant="ghost" onPress={handleResend} small />
            <AppButton label="Change email" variant="ghost" onPress={() => navigation.navigate('Login', { returnTo })} small />
          </View>
        </>
      ) : (
        <>
          <AuthPasswordField label="Password" value={password} onChange={setPassword} placeholder="At least 6 characters" />
          <AuthPasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter password" />
          <AppButton
            label={loading ? 'Saving…' : 'Complete sign up'}
            variant="accent"
            onPress={handlePasswordSubmit}
            loading={loading}
            disabled={loading}
            style={{ marginTop: SPACING.sm }}
          />
        </>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: SPACING.md },
  label: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text, marginBottom: 6 },
  otpInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    fontFamily: FONTS.bold,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: '#fafafa',
    color: COLORS.text,
  },
  secondary: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.md },
  success: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.success, marginBottom: SPACING.sm },
  error: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.error, marginBottom: SPACING.sm },
});
