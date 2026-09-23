import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ImageStyle,
  StyleProp,
  ImageResizeMode,
} from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import { resolveImageUrl } from '../utils/images';

interface RemoteImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  label?: string;
  resizeMode?: ImageResizeMode;
}

export default function RemoteImage({
  uri,
  style,
  label,
  resizeMode = 'contain',
}: RemoteImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveImageUrl(uri);

  if (!resolved || failed) {
    const initial = label?.trim()?.[0]?.toUpperCase() || '🌿';
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>{initial}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolved }}
      style={style}
      onError={() => setFailed(true)}
      resizeMode={resizeMode}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.accent,
  },
});
