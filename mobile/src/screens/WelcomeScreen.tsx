import React from 'react';
import { View, Image, StyleSheet, StatusBar, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <Image
        source={require('../../assets/splash-screen.png')}
        style={styles.splashImage}
        resizeMode="cover"
      />

      <View style={[styles.footerOverlay, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={styles.startTap}
          onPress={onStart}
          accessibilityRole="button"
          accessibilityLabel="Start"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  splashImage: {
    flex: 1,
    width: '100%',
  },
  footerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: SCREEN_HEIGHT * 0.22,
    justifyContent: 'center',
  },
  startTap: {
    width: '100%',
    maxWidth: 320,
    height: 54,
    borderRadius: 999,
  },
});
