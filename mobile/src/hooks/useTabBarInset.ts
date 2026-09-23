import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the floating curved tab bar (excluding safe-area inset). */
export const TAB_BAR_HEIGHT = 108;

export function useTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, 8);
}
