import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import RemoteImage from './RemoteImage';
import { COLORS, BORDER_RADIUS, FONTS, SPACING } from '../constants/theme';

interface Banner {
  id: number;
  title: string;
  image: string;
}

interface BannerSliderProps {
  banners: Banner[];
}

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32;

export default function BannerSlider({ banners }: BannerSliderProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  if (!banners.length) {
    return (
      <View style={styles.heroFallback}>
        <Text style={styles.heroTitle}>Fresh Farm Milk Delivered Daily</Text>
        <Text style={styles.heroSubtitle}>
          Pure, natural dairy products straight from Rudra&apos;s Farm to your doorstep.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Carousel
        loop
        width={BANNER_WIDTH}
        height={160}
        autoPlay
        autoPlayInterval={4000}
        data={banners}
        scrollAnimationDuration={800}
        onSnapToItem={setActiveIndex}
        renderItem={({ item }) => (
          <View style={styles.bannerItem}>
            <RemoteImage uri={item.image} label={item.title} style={styles.image} resizeMode="cover" />
            {item.title ? (
              <View style={styles.overlay}>
                <Text style={styles.title}>{item.title}</Text>
              </View>
            ) : null}
          </View>
        )}
      />
      <View style={styles.dots}>
        {banners.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.activeDot]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md, alignItems: 'center', paddingHorizontal: SPACING.md },
  heroFallback: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS,
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  bannerItem: {
    width: BANNER_WIDTH,
    height: 160,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 12,
  },
  title: { color: '#fff', fontSize: 16, fontFamily: FONTS.semiBold },
  dots: { flexDirection: 'row', marginTop: 8, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  activeDot: { backgroundColor: COLORS.accent, width: 20 },
});
