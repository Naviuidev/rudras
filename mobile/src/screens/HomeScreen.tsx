import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BannerSlider from '../components/BannerSlider';
import CategoryScroll from '../components/CategoryScroll';
import HomeUserHeader from '../components/HomeUserHeader';
import ProductGridCard from '../components/ProductGridCard';
import AppButton from '../components/AppButton';
import Card from '../components/Card';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, API_URL } from '../constants/theme';
import { getBanners, getProducts, getCategories, getActiveSubscription } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTabBarInset } from '../hooks/useTabBarInset';
import { useServiceArea } from '../context/ServiceAreaContext';
import { toCategoryDisplayItems } from '../utils/categoryDisplay';
import { filterProductsByShop, type ShopType } from '../utils/productShop';

const TESTIMONIALS = [
  { name: 'Priya S.', text: 'The milk tastes so fresh! My family loves the daily delivery.', rating: 5 },
  { name: 'Rahul M.', text: 'Reliable service and great quality curd. Highly recommended.', rating: 5 },
  { name: 'Anita K.', text: 'Easy subscription management and skip options make it perfect for us.', rating: 5 },
];

type HomeTab = 'subscriptions' | 'products';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user, isAuthenticated } = useAuth();
  const requireAuth = useRequireAuth();
  const tabBarInset = useTabBarInset();
  const { promptForServiceArea, status } = useServiceArea();

  useEffect(() => {
    if (status === 'unknown') {
      promptForServiceArea();
    }
  }, [status, promptForServiceArea]);
  const [banners, setBanners] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<HomeTab>('subscriptions');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadData = useCallback(async () => {
    setLoadError('');
    try {
      const requests: Promise<any>[] = [getBanners(), getProducts(), getCategories()];
      if (isAuthenticated) requests.push(getActiveSubscription());

      const results = await Promise.all(requests);
      setBanners(results[0].data.data || []);
      setProducts(results[1].data.data || []);
      setCategories(toCategoryDisplayItems(results[2].data.data || []));
      setActiveSub(isAuthenticated && results[3] ? results[3].data.data : null);
    } catch (err: any) {
      const msg = err.response?.status
        ? `API error ${err.response.status}`
        : err.message || 'Network error';
      setLoadError(
        `Could not load store data (${msg}). Run: cd backend && php -S 0.0.0.0:8000 router.php — API: ${API_URL}`
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const subscriptionProducts = filterProductsByShop(products, 'subscription');
  const oneTimeProducts = filterProductsByShop(products, 'one_time');

  const goToShop = (params: { categorySlug?: string; productId?: number; product?: any }) => {
    navigation.navigate('Products', {
      screen: 'ProductsMain',
      params,
    });
  };

  const openCategory = (slug: string) => {
    goToShop({ categorySlug: slug });
  };

  const openProduct = (item: any) => {
    navigation.navigate('Products', {
      screen: 'ProductsMain',
      params: {
        productId: item.id,
        product: item,
        categorySlug: item.category,
      },
    });
  };

  const tabProducts = activeTab === 'subscriptions' ? subscriptionProducts : oneTimeProducts;

  return (
    <View style={styles.container}>
      <HomeUserHeader name={user?.name} email={user?.email} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarInset }}
      >
        <View style={styles.body}>
          {loadError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Store data unavailable</Text>
              <Text style={styles.errorText}>{loadError}</Text>
              <AppButton label="Retry" onPress={loadData} style={styles.retryBtn} />
            </View>
          ) : null}

          <BannerSlider banners={banners} />

          <CategoryScroll
            categories={categories}
            onSelect={(cat) => openCategory(cat.slug)}
          />

          {/* Sticky tab bar */}
          <View style={styles.tabBar}>
            <AppButton
              label="Subscriptions"
              small
              variant={activeTab === 'subscriptions' ? 'accent' : 'outline'}
              onPress={() => setActiveTab('subscriptions')}
              style={styles.tabBtn}
            />
            <AppButton
              label="Products"
              small
              variant={activeTab === 'products' ? 'accent' : 'outline'}
              onPress={() => setActiveTab('products')}
              style={styles.tabBtn}
            />
          </View>

          {/* Tab content */}
          <View style={styles.tabContent}>
            {activeTab === 'subscriptions' && activeSub && (
              <View style={styles.activeSubCard}>
                <Text style={styles.activeSubTitle}>Your active subscription</Text>
                <Text style={styles.activeSubText}>
                  {activeSub.quantity} per delivery · {activeSub.remaining_days} days left
                </Text>
                <AppButton
                  label="Manage"
                  small
                  onPress={() => {
                    if (requireAuth({ type: 'subscription' })) {
                      navigation.navigate('Subscription');
                    }
                  }}
                  style={styles.manageBtn}
                />
              </View>
            )}

            {loading ? (
              <Text style={styles.loadingText}>Loading…</Text>
            ) : tabProducts.length > 0 ? (
              <View style={styles.productGrid}>
                {tabProducts.slice(0, 12).map((item) => (
                  <View key={item.id} style={styles.gridCell}>
                    <ProductGridCard product={item} onPress={() => openProduct(item)} />
                  </View>
                ))}
              </View>
            ) : activeTab === 'subscriptions' ? (
              <Card>
                <Text style={styles.emptyText}>No subscription products yet.</Text>
                <AppButton
                  label="Create Subscription"
                  variant="accent"
                  onPress={() => {
                    if (requireAuth({ type: 'subscriptionCreate' })) {
                      navigation.navigate('SubscriptionCreate');
                    }
                  }}
                />
              </Card>
            ) : (
              <Text style={styles.emptyText}>No products yet. Add products in admin.</Text>
            )}

            <AppButton
              label={activeTab === 'subscriptions' ? 'Browse all subscriptions' : 'Browse all products'}
              onPress={() =>
                goToShop({})
              }
              style={styles.browseAll}
            />
          </View>

          <View style={styles.testimonialSection}>
            <Text style={styles.testimonialHeading}>What Our Customers Say</Text>
            {TESTIMONIALS.map((t) => (
              <View key={t.name} style={styles.testimonialCard}>
                <Text style={styles.stars}>{'⭐'.repeat(t.rating)}</Text>
                <Text style={styles.testimonialQuote}>&ldquo;{t.text}&rdquo;</Text>
                <Text style={styles.testimonialAuthor}>— {t.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9f6' },
  body: { paddingBottom: SPACING.xl },
  errorBox: {
    margin: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#fff3cd',
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  errorTitle: { fontFamily: FONTS.semiBold, fontSize: 15, color: '#664d03', marginBottom: 6 },
  errorText: { fontFamily: FONTS.regular, fontSize: 12, color: '#664d03', lineHeight: 18 },
  retryBtn: { marginTop: SPACING.sm, alignSelf: 'flex-start' },
  tabBar: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#f8f9f6',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: { flex: 1 },
  tabContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  activeSubCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.md,
  },
  activeSubTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.accent },
  activeSubText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text, marginTop: 4 },
  manageBtn: { marginTop: SPACING.sm, alignSelf: 'flex-start' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  gridCell: { width: '50%', paddingHorizontal: 4 },
  loadingText: { fontFamily: FONTS.regular, color: COLORS.textLight, padding: SPACING.md },
  emptyText: {
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  browseAll: { marginTop: SPACING.md, marginBottom: SPACING.lg },
  testimonialSection: { paddingHorizontal: SPACING.md, marginBottom: SPACING.lg },
  testimonialHeading: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  testimonialCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  stars: { fontFamily: FONTS.regular, fontSize: 14, marginBottom: SPACING.sm },
  testimonialQuote: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  testimonialAuthor: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.accent },
});
