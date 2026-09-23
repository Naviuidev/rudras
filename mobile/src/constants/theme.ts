import Constants from 'expo-constants';

export const COLORS = {
  primary: '#d9e8c9',
  secondary: '#d6e8f1',
  accent: '#2d5016',
  text: '#1a1a1a',
  textLight: '#666666',
  white: '#ffffff',
  error: '#d32f2f',
  success: '#388e3c',
  border: '#e0e0e0',
  cardBg: '#ffffff',
};

/** Cool light green page background used behind shop cards and headers. */
export const SCREEN_BG = COLORS.primary;

export const FONTS = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const BORDER_RADIUS = 12;

/** Resolve API base URL — replaces localhost with LAN IP when running in Expo Go on a device. */
function resolveApiUrl(): string {
  const configured =
    Constants.expoConfig?.extra?.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL ||
    'http://localhost:8000/api';

  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ||
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri;

  if (configured.includes('localhost') && debuggerHost) {
    const lanHost = debuggerHost.split(':')[0];
    return configured.replace('localhost', lanHost);
  }

  return configured;
}

export const API_URL = resolveApiUrl();

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  packed: 'Packed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
