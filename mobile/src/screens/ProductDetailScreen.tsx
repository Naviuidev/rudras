import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import BackHeader from '../components/BackHeader';
import ProductDetailPanel from '../components/ProductDetailPanel';
import { COLORS, SCREEN_BG } from '../constants/theme';

/** Fallback screen when navigated via ProductDetail route — redirects to inline shop view. */
export default function ProductDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const productId = route.params?.productId ?? route.params?.product?.id;
  const product = route.params?.product;

  useEffect(() => {
    navigation.replace('ProductsMain', {
      categorySlug: route.params?.categorySlug ?? product?.category,
      productId,
      product,
    });
  }, [navigation, productId, product, route.params?.categorySlug]);

  return (
    <View style={styles.container}>
      <BackHeader onBack={() => navigation.goBack()} />
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SCREEN_BG },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
