import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../components/ScreenHeader';
import CategorySidebar from '../components/CategorySidebar';
import ProductGridCard from '../components/ProductGridCard';
import ProductDetailPanel from '../components/ProductDetailPanel';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SCREEN_BG } from '../constants/theme';
import { getProducts, getCategories } from '../services/api';
import { toCategoryDisplayItems } from '../utils/categoryDisplay';
import ShopTypeToggle from '../components/ShopTypeToggle';
import { filterProductsByShop, type ShopType } from '../utils/productShop';
import { useServiceArea } from '../context/ServiceAreaContext';
import { useTabBarInset } from '../hooks/useTabBarInset';

export default function ProductsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(route.params?.categorySlug ?? '');
  const [selectedProduct, setSelectedProduct] = useState<any>(route.params?.product ?? null);
  const [shopType, setShopType] = useState<ShopType>('one_time');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const tabBarInset = useTabBarInset();
  const { promptForServiceArea, status } = useServiceArea();

  useEffect(() => {
    if (status === 'unknown') {
      promptForServiceArea();
    }
  }, [status, promptForServiceArea]);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(toCategoryDisplayItems(res.data.data || [])))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (route.params?.categorySlug !== undefined) {
      setCategory(route.params.categorySlug);
    }
    if (route.params?.product) {
      setSelectedProduct(route.params.product);
    } else if (route.params?.productId) {
      setSelectedProduct({ id: route.params.productId });
    }
  }, [route.params?.categorySlug, route.params?.product, route.params?.productId]);

  useEffect(() => {
    if (categories.length > 0 && !category && !search.trim()) {
      setCategory(categories[0].slug);
    }
  }, [categories, category, search]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts({
        category: category || undefined,
        search: search.trim() || undefined,
      });
      setAllProducts(res.data.data || []);
    } catch {
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  const selectedCategoryName = categories.find((c) => c.slug === category)?.name;
  const isSearchMode = search.trim().length > 0;
  const visibleProducts = filterProductsByShop(allProducts, shopType);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleCategorySelect = (slug: string) => {
    setCategory(slug);
    setSelectedProduct(null);
    setSearch('');
  };

  const pageTitle = selectedProduct?.name
    ? selectedProduct.name
    : isSearchMode
      ? `Search: "${search.trim()}"`
      : selectedCategoryName || 'Products';

  const openProduct = (item: any) => {
    setSelectedProduct(item);
  };

  const closeProduct = () => {
    setSelectedProduct(null);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Shop"
        subtitle="Browse by category"
        onBack={() => {
          if (selectedProduct) {
            closeProduct();
          } else {
            navigation.getParent()?.navigate('Home');
          }
        }}
      />

      <View style={styles.shopPage}>
        <CategorySidebar
          categories={categories}
          selectedSlug={isSearchMode && !category ? '' : category}
          onSelect={handleCategorySelect}
        />

        <View style={styles.main}>
          <Text style={styles.pageTitle} numberOfLines={2}>
            {pageTitle}
          </Text>

          {selectedProduct ? (
            <ProductDetailPanel
              product={selectedProduct}
              productId={selectedProduct?.id}
              onBack={closeProduct}
              onSelectProduct={openProduct}
            />
          ) : (
            <>
              <ShopTypeToggle value={shopType} onChange={setShopType} />

              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={COLORS.textLight} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search products…"
                  placeholderTextColor={COLORS.textLight}
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                    <Text style={styles.clearSearch}>×</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.subtitle}>
                {loading
                  ? 'Loading products…'
                  : `${visibleProducts.length} product${visibleProducts.length === 1 ? '' : 's'}${
                      selectedCategoryName && !isSearchMode ? ` in ${selectedCategoryName}` : ''
                    }${isSearchMode ? ` matching "${search.trim()}"` : ''} · ${
                      shopType === 'subscription' ? 'Subscriptions' : 'One time delivery'
                    }`}
              </Text>

              <FlatList
                data={visibleProducts}
                numColumns={2}
                keyExtractor={(item: any) => String(item.id)}
                columnWrapperStyle={styles.row}
                contentContainerStyle={[styles.grid, { paddingBottom: tabBarInset }]}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />
                }
                renderItem={({ item }: any) => (
                  <View style={styles.gridCell}>
                    <ProductGridCard product={item} onPress={() => openProduct(item)} />
                  </View>
                )}
                ListEmptyComponent={
                  !loading ? (
                    <View style={styles.empty}>
                      <Text style={styles.emptyTitle}>No products found</Text>
                      <Text style={styles.emptyText}>
                        {isSearchMode
                          ? 'No products match your search. Try another term or category.'
                          : 'No products in this category. Try another category.'}
                      </Text>
                    </View>
                  ) : null
                }
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SCREEN_BG },
  shopPage: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  main: { flex: 1 },
  pageTitle: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    color: COLORS.text,
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9f6',
    marginHorizontal: SPACING.sm,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text,
  },
  clearSearch: { fontSize: 22, color: COLORS.textLight, lineHeight: 24 },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  grid: { paddingHorizontal: 4, paddingBottom: SPACING.lg },
  row: { justifyContent: 'flex-start' },
  gridCell: { width: '50%', paddingHorizontal: 4, marginBottom: SPACING.sm },
  empty: { padding: SPACING.lg, alignItems: 'center' },
  emptyTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text, marginBottom: 8 },
  emptyText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight, textAlign: 'center' },
});
