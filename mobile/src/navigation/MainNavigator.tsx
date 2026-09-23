import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SubscriptionCreateScreen from '../screens/SubscriptionCreateScreen';
import OrdersScreen from '../screens/OrdersScreen';
import AddressesScreen from '../screens/AddressesScreen';
import CustomCurvedTabBar from '../components/CustomCurvedTabBar';
import { TAB_BAR_HEIGHT } from '../hooks/useTabBarInset';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HIDE_TAB_BAR_ROUTES = new Set(['SubscriptionCreate', 'Checkout', 'Addresses']);

function shouldHideTabBar(routeName?: string): boolean {
  return !!routeName && HIDE_TAB_BAR_ROUTES.has(routeName);
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen
        name="SubscriptionCreate"
        component={SubscriptionCreateScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductsMain" component={ProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen
        name="SubscriptionCreate"
        component={SubscriptionCreateScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CartMain" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen
        name="SubscriptionCreate"
        component={SubscriptionCreateScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => {
        const activeRoute = props.state.routes[props.state.index];
        const focusedRoute = getFocusedRouteNameFromRoute(activeRoute);
        if (shouldHideTabBar(focusedRoute)) return null;
        return <CustomCurvedTabBar {...props} />;
      }}
      screenOptions={({ route }) => {
        const focusedRoute = getFocusedRouteNameFromRoute(route);
        const hideTabBar = shouldHideTabBar(focusedRoute);

        return {
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: hideTabBar
            ? { display: 'none' }
            : {
                position: 'absolute',
                backgroundColor: 'transparent',
                borderTopWidth: 0,
                elevation: 0,
                height: TAB_BAR_HEIGHT,
              },
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Products" component={ProductsStack} />
      <Tab.Screen name="Cart" component={CartStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
