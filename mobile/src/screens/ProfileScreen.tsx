import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTabBarInset } from '../hooks/useTabBarInset';
import { getProfile, getCmsPage } from '../services/api';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout, updateUser, isAuthenticated } = useAuth();
  const requireAuth = useRequireAuth();
  const tabBarInset = useTabBarInset();
  const [profile, setProfile] = useState<any>(null);
  const [editModal, setEditModal] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [cmsModal, setCmsModal] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated) loadProfile();
  }, [isAuthenticated]);

  const loadProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data.data);
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    try {
      await updateUser({ name, mobile });
      setEditModal(false);
      await loadProfile();
      Alert.alert('Success', 'Profile updated');
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const openCms = async (slug: string) => {
    try {
      const res = await getCmsPage(slug);
      const page = res.data.data;
      setCmsModal({ title: page.title, content: page.content });
    } catch {
      Alert.alert('Error', 'Failed to load page');
    }
  };

  const goLogin = () => navigation.getParent()?.navigate('Login', { returnTo: { type: 'profile' } });
  const goSignup = () => navigation.getParent()?.navigate('Login', { returnTo: { type: 'profile' } });

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Profile" subtitle="Sign in to manage your account" />
        <ScrollView contentContainerStyle={styles.guestWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.guestTitle}>Welcome to Rudra&apos;s Farm Fresh</Text>
          <Text style={styles.guestText}>
            Browse products freely. Sign in or create an account when you&apos;re ready to order or subscribe.
          </Text>
          <AppButton label="Login" variant="accent" onPress={goLogin} style={styles.guestBtn} />
          <AppButton label="Sign Up" onPress={goSignup} style={styles.guestBtn} />
          <AppButton label="Privacy Policy" variant="ghost" onPress={() => openCms('privacy')} />
          <AppButton label="Terms & Conditions" variant="ghost" onPress={() => openCms('terms')} />
        </ScrollView>
        <Modal visible={!!cmsModal} animationType="slide">
          <View style={styles.cmsContainer}>
            <AppButton label="Close" onPress={() => setCmsModal(null)} style={styles.cmsClose} />
            <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
              <Text style={styles.cmsTitle}>{cmsModal?.title}</Text>
              <Text style={styles.cmsContent}>{cmsModal?.content?.replace(/<[^>]+>/g, '')}</Text>
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  }

  const menuItems = [
    { label: 'Edit Profile', action: () => setEditModal(true) },
    { label: 'My Addresses', action: () => navigation.navigate('Addresses') },
    { label: 'My Orders', action: () => navigation.navigate('Orders') },
    { label: 'Subscription', action: () => navigation.navigate('Subscription') },
    { label: 'Shopping Cart', action: () => navigation.getParent()?.navigate('Cart') },
    { label: 'Privacy Policy', action: () => openCms('privacy') },
    { label: 'Terms & Conditions', action: () => openCms('terms') },
    { label: 'Logout', action: handleLogout, danger: true },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Profile" subtitle={user?.email || ''} />
      <ScrollView contentContainerStyle={{ paddingBottom: tabBarInset }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.mobile && <Text style={styles.mobile}>{user.mobile}</Text>}

        {profile?.active_subscription && (
          <Card title="Active Subscription">
            <Text style={styles.subText}>
              {profile.active_subscription.quantity}/delivery — {profile.active_subscription.remaining_days} days remaining
            </Text>
            <AppButton label="Manage" small onPress={() => navigation.navigate('Subscription')} style={styles.mt} />
          </Card>
        )}

        {profile?.order_history?.length > 0 && (
          <Card title="Recent Orders">
            {profile.order_history.slice(0, 3).map((order: any) => (
              <View key={order.id} style={styles.orderRow}>
                <Text style={styles.orderNum}>{order.order_number}</Text>
                <OrderStatusBadge status={order.order_status} />
              </View>
            ))}
            <AppButton label="View all orders" small onPress={() => navigation.navigate('Orders')} style={styles.mt} />
          </Card>
        )}

        <View style={styles.menu}>
          {menuItems.map((item) => (
            <AppButton
              key={item.label}
              label={item.label}
              onPress={item.action}
              variant="ghost"
              style={styles.menuItem}
              textStyle={item.danger ? styles.menuTextDanger : styles.menuText}
            />
          ))}
        </View>

        <Modal visible={editModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
              <TextInput
                style={styles.input}
                value={mobile}
                onChangeText={setMobile}
                placeholder="Mobile"
                keyboardType="phone-pad"
              />
              <View style={styles.modalActions}>
                <AppButton label="Cancel" onPress={() => setEditModal(false)} />
                <AppButton label="Save" variant="accent" onPress={handleSave} />
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={!!cmsModal} animationType="slide">
          <View style={styles.cmsContainer}>
            <AppButton label="Close" onPress={() => setCmsModal(null)} style={styles.cmsClose} />
            <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>
              <Text style={styles.cmsTitle}>{cmsModal?.title}</Text>
              <Text style={styles.cmsContent}>{cmsModal?.content?.replace(/<[^>]+>/g, '')}</Text>
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9f6' },
  guestWrap: { padding: SPACING.lg, alignItems: 'center' },
  guestTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text, textAlign: 'center', marginBottom: SPACING.sm },
  guestText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.lg },
  guestBtn: { width: '100%', marginBottom: SPACING.sm },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  avatarText: { fontFamily: FONTS.bold, fontSize: 32, color: COLORS.accent },
  name: { fontFamily: FONTS.bold, fontSize: 22, textAlign: 'center', marginTop: SPACING.md },
  email: { fontFamily: FONTS.regular, color: COLORS.textLight, textAlign: 'center' },
  mobile: { fontFamily: FONTS.regular, color: COLORS.textLight, textAlign: 'center', marginTop: 2 },
  subText: { fontFamily: FONTS.regular, color: COLORS.text },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  orderNum: { fontFamily: FONTS.medium, fontSize: 13 },
  mt: { marginTop: SPACING.sm, alignSelf: 'flex-start' },
  menu: { margin: SPACING.md, gap: SPACING.xs },
  menuItem: { alignSelf: 'stretch', justifyContent: 'flex-start', paddingHorizontal: SPACING.md },
  menuText: { fontFamily: FONTS.medium, fontSize: 15, textAlign: 'left' },
  menuTextDanger: { fontFamily: FONTS.medium, fontSize: 15, textAlign: 'left', color: COLORS.error },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SPACING.lg },
  modalTitle: { fontFamily: FONTS.bold, fontSize: 20, marginBottom: SPACING.md },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontFamily: FONTS.regular,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cmsContainer: { flex: 1, backgroundColor: COLORS.white, paddingTop: 50 },
  cmsClose: { position: 'absolute', top: 50, right: 16, zIndex: 1 },
  cmsTitle: { fontFamily: FONTS.bold, fontSize: 24, marginBottom: SPACING.md },
  cmsContent: { fontFamily: FONTS.regular, fontSize: 15, lineHeight: 24, color: COLORS.text },
});
