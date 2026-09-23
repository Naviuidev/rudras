import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_WIDTH = SCREEN_WIDTH - 48;
const BAR_HEIGHT = 62;
const CORNER_RADIUS = 30;
const BUBBLE_SIZE = 54;
const NOTCH_RADIUS = 36;
const NOTCH_DEPTH = 24;
const BAR_TOP_INSET = 8;

type TabIconName = keyof typeof Ionicons.glyphMap;

const TAB_META: Record<string, { label: string; active: TabIconName; inactive: TabIconName }> = {
  Home: { label: 'Home', active: 'home', inactive: 'home-outline' },
  Products: { label: 'Shop', active: 'grid', inactive: 'grid-outline' },
  Cart: { label: 'Cart', active: 'cart', inactive: 'cart-outline' },
  Profile: { label: 'Profile', active: 'person', inactive: 'person-outline' },
};

function buildTabBarPath(width: number, height: number, notchCenterX: number): string {
  const r = CORNER_RADIUS;
  const left = Math.max(r + 2, notchCenterX - NOTCH_RADIUS);
  const right = Math.min(width - r - 2, notchCenterX + NOTCH_RADIUS);

  return [
    `M 0 ${r}`,
    `Q 0 0 ${r} 0`,
    `L ${left} 0`,
    `C ${left + 16} 0 ${notchCenterX - 22} ${NOTCH_DEPTH} ${notchCenterX} ${NOTCH_DEPTH}`,
    `C ${notchCenterX + 22} ${NOTCH_DEPTH} ${right - 16} 0 ${right} 0`,
    `L ${width - r} 0`,
    `Q ${width} 0 ${width} ${r}`,
    `L ${width} ${height}`,
    `L 0 ${height}`,
    'Z',
  ].join(' ');
}

function getTabCenterX(index: number, tabCount: number): number {
  return ((index + 0.5) / tabCount) * BAR_WIDTH;
}

interface TabSlotProps {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  badge?: number;
}

function TabSlot({ routeName, isFocused, onPress, onLongPress, badge }: TabSlotProps) {
  const meta = TAB_META[routeName];
  if (!meta) return <View style={styles.tabSlot} />;

  return (
    <TouchableOpacity
      style={styles.tabSlot}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
    >
      {isFocused ? (
        <View style={styles.activeLabelWrap}>
          <Text style={styles.activeLabel}>{meta.label}</Text>
        </View>
      ) : (
        <>
          <View style={styles.inactiveIconWrap}>
            <Ionicons name={meta.inactive} size={22} color="#b0b8ad" />
            {badge && badge > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.inactiveLabel}>{meta.label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export default function CustomCurvedTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { cartCount } = useAuth();

  const activeIndex = state.index;
  const tabCount = state.routes.length;
  const notchCenterX = getTabCenterX(activeIndex, tabCount);

  const path = useMemo(
    () => buildTabBarPath(BAR_WIDTH, BAR_HEIGHT, notchCenterX),
    [notchCenterX]
  );

  const activeRoute = state.routes[activeIndex];
  const activeMeta = activeRoute ? TAB_META[activeRoute.name] : null;

  const navigateTo = (routeName: string) => {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return;

    const index = state.routes.findIndex((r) => r.key === route.key);
    const isFocused = state.index === index;

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.barOuter}>
        {activeMeta ? (
          <View
            style={[
              styles.floatingBubble,
              { left: notchCenterX - BUBBLE_SIZE / 2, top: BAR_TOP_INSET },
            ]}
          >
            <Ionicons name={activeMeta.active} size={24} color={COLORS.accent} />
            {activeRoute?.name === 'Cart' && cartCount > 0 ? (
              <View style={styles.bubbleBadge}>
                <Text style={styles.bubbleBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 55}
          tint="light"
          style={styles.blur}
          experimentalBlurMethod="dimezisBlurView"
        >
          <View style={styles.glassOverlay}>
            <Svg width={BAR_WIDTH} height={BAR_HEIGHT}>
              <Path d={path} fill="rgba(255,255,255,0.55)" />
            </Svg>

            <View style={styles.barContent}>
              {state.routes.map((route) => {
                const index = state.routes.findIndex((r) => r.key === route.key);
                const isFocused = state.index === index;

                return (
                  <TabSlot
                    key={route.key}
                    routeName={route.name}
                    isFocused={isFocused}
                    onPress={() => navigateTo(route.name)}
                    onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                    badge={route.name === 'Cart' ? cartCount : undefined}
                  />
                );
              })}
            </View>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  barOuter: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT + BUBBLE_SIZE / 2 + 8,
    marginTop: 4,
  },
  floatingBubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  blur: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BAR_HEIGHT,
    borderRadius: CORNER_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#2d5016',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 10,
  },
  glassOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  barContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: BAR_HEIGHT,
    paddingBottom: 2,
  },
  inactiveIconWrap: {
    marginBottom: 4,
    position: 'relative',
  },
  inactiveLabel: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#b0b8ad',
  },
  activeLabelWrap: {
    paddingTop: BUBBLE_SIZE / 2 + 6,
    alignItems: 'center',
  },
  activeLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.text,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  bubbleBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bubbleBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
});
