import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import ScreenHeader from '../components/ScreenHeader';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { getOrders } from '../services/api';

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const res = await getOrders();
      setOrders(res.data.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const renderOrder = ({ item }: any) => (
    <Card>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.order_number}</Text>
        <OrderStatusBadge status={item.order_status} />
      </View>
      <Text style={styles.orderDate}>
        {new Date(item.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </Text>
      <Text style={styles.orderTotal}>₹{parseFloat(item.total_amount).toFixed(2)}</Text>
      {item.delivery_address && (
        <Text style={styles.orderAddress} numberOfLines={2}>{item.delivery_address}</Text>
      )}
      {item.items?.map((oi: any) => (
        <Text key={oi.id} style={styles.orderItem}>
          {oi.product_name} × {oi.quantity}
        </Text>
      ))}
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Orders" onBack={() => navigation.goBack()} />
      <FlatList
        data={orders}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9f6' },
  list: { padding: SPACING.md, flexGrow: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text },
  orderDate: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  orderTotal: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.accent, marginTop: 8 },
  orderAddress: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textLight, marginTop: 6 },
  orderItem: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontFamily: FONTS.regular, color: COLORS.textLight, marginTop: 12 },
});
